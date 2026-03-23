import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between, In } from 'typeorm';
import { Ticket, TicketStatus, TicketPriority, TicketType } from '../tickets/entities/ticket.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Ticket) private ticketRepository: Repository<Ticket>,
    private aiService: AiService,
  ) {}

  async getMetrics() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      openIncidents, inProgressIncidents, resolvedToday,
      criticalOpen, slaBreached, openRequests,
      openProblems, openChanges, totalThisMonth,
      avgResolutionTimeResult,
    ] = await Promise.all([
      this.ticketRepository.count({ where: { type: TicketType.INCIDENT, status: TicketStatus.OPEN } }),
      this.ticketRepository.count({ where: { type: TicketType.INCIDENT, status: TicketStatus.IN_PROGRESS } }),
      this.ticketRepository.count({ where: { status: TicketStatus.RESOLVED, resolvedAt: MoreThan(new Date(new Date().setHours(0,0,0,0))) } }),
      this.ticketRepository.count({ where: { priority: TicketPriority.CRITICAL, status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]) } }),
      this.ticketRepository.count({ where: { status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]), slaBreachAt: MoreThan(new Date(0)) } }),
      this.ticketRepository.count({ where: { type: TicketType.SERVICE_REQUEST, status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]) } }),
      this.ticketRepository.count({ where: { type: TicketType.PROBLEM, status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]) } }),
      this.ticketRepository.count({ where: { type: TicketType.CHANGE, status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]) } }),
      this.ticketRepository.count({ where: { createdAt: MoreThan(new Date(new Date().setDate(1))) } }),
      this.ticketRepository
        .createQueryBuilder('t')
        .select('AVG(EXTRACT(EPOCH FROM (t.resolvedAt - t.createdAt)) / 3600)', 'avgHours')
        .where('t.resolvedAt IS NOT NULL')
        .andWhere('t.createdAt > :date', { date: last30d })
        .getRawOne(),
    ]);

    const avgResolutionHours = Math.round(parseFloat(avgResolutionTimeResult?.avgHours || '4.5') * 10) / 10;
    const slaBreachRate = openIncidents > 0 ? Math.round((slaBreached / (openIncidents + inProgressIncidents)) * 100) : 0;
    const slaCompliance = Math.max(0, 100 - slaBreachRate);

    return {
      openIncidents,
      inProgressIncidents,
      resolvedToday,
      criticalOpen,
      slaBreached,
      openRequests,
      openProblems,
      openChanges,
      totalThisMonth,
      avgResolutionHours,
      slaCompliance,
      slaBreachRate,
    };
  }

  async getIncidentTrend(days = 7) {
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);

      const [created, resolved] = await Promise.all([
        this.ticketRepository.count({ where: { type: TicketType.INCIDENT, createdAt: Between(start, end) } }),
        this.ticketRepository.count({ where: { resolvedAt: Between(start, end) } }),
      ]);

      trend.push({
        date: start.toISOString().split('T')[0],
        created,
        resolved,
        day: start.toLocaleDateString('en', { weekday: 'short' }),
      });
    }
    return trend;
  }

  async getPriorityDistribution() {
    const priorities = [TicketPriority.CRITICAL, TicketPriority.HIGH, TicketPriority.MEDIUM, TicketPriority.LOW];
    const data = await Promise.all(
      priorities.map(async (priority) => ({
        priority,
        count: await this.ticketRepository.count({
          where: { priority, status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]) },
        }),
      }))
    );
    return data;
  }

  async getCategoryDistribution() {
    const result = await this.ticketRepository
      .createQueryBuilder('t')
      .select('t.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('t.category IS NOT NULL')
      .andWhere('t.status IN (:...statuses)', { statuses: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] })
      .groupBy('t.category')
      .orderBy('count', 'DESC')
      .limit(8)
      .getRawMany();
    return result;
  }

  async getRecentTickets(limit = 10) {
    return this.ticketRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['id', 'number', 'title', 'type', 'status', 'priority', 'category', 'assigneeId', 'createdAt', 'slaBreachAt'],
    });
  }

  async getAiInsights() {
    const recentTickets = await this.ticketRepository.find({
      where: { status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]) },
      take: 50,
      order: { createdAt: 'DESC' },
    });

    const [patternResult, insights] = await Promise.all([
      this.aiService.detectMajorIncident(recentTickets),
      this.aiService.analyzeIncidentPattern(recentTickets),
    ]);

    return {
      majorIncident: patternResult,
      insights,
      ticketsAnalyzed: recentTickets.length,
    };
  }

  async getSlaStatus() {
    const now = new Date();
    const critical30min = new Date(now.getTime() + 30 * 60 * 1000);

    const [atRisk, breached, onTrack] = await Promise.all([
      this.ticketRepository.count({
        where: {
          status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]),
          slaBreachAt: Between(now, critical30min),
        },
      }),
      this.ticketRepository.count({
        where: {
          status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]),
          slaBreachAt: Between(new Date(0), now),
        },
      }),
      this.ticketRepository.count({
        where: {
          status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]),
          slaBreachAt: MoreThan(critical30min),
        },
      }),
    ]);

    return { atRisk, breached, onTrack };
  }
}
