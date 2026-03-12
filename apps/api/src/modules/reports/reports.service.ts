import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Ticket, TicketStatus, TicketType, TicketPriority } from '../tickets/entities/ticket.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Ticket) private ticketRepository: Repository<Ticket>,
    private aiService: AiService,
  ) {}

  async getSlaReport(startDate: Date, endDate: Date) {
    const tickets = await this.ticketRepository.find({
      where: { createdAt: Between(startDate, endDate) },
      select: ['id', 'number', 'type', 'priority', 'status', 'createdAt', 'resolvedAt', 'slaBreachAt', 'category'],
    });

    const breached = tickets.filter(t => t.slaBreachAt && t.resolvedAt && new Date(t.resolvedAt) > new Date(t.slaBreachAt));
    const metSla = tickets.filter(t => t.resolvedAt && (!t.slaBreachAt || new Date(t.resolvedAt) <= new Date(t.slaBreachAt)));
    const open = tickets.filter(t => [TicketStatus.OPEN, TicketStatus.IN_PROGRESS].includes(t.status));

    const compliance = tickets.length > 0 ? Math.round((metSla.length / (metSla.length + breached.length || 1)) * 100) : 100;

    const byPriority = [TicketPriority.CRITICAL, TicketPriority.HIGH, TicketPriority.MEDIUM, TicketPriority.LOW].map(priority => {
      const priorityTickets = tickets.filter(t => t.priority === priority);
      const priorityBreached = priorityTickets.filter(t => t.slaBreachAt && t.resolvedAt && new Date(t.resolvedAt) > new Date(t.slaBreachAt));
      return {
        priority,
        total: priorityTickets.length,
        breached: priorityBreached.length,
        compliance: priorityTickets.length > 0 ? Math.round(((priorityTickets.length - priorityBreached.length) / priorityTickets.length) * 100) : 100,
      };
    });

    return { total: tickets.length, breached: breached.length, metSla: metSla.length, openAtRisk: open.length, compliance, byPriority };
  }

  async getIncidentTrend(period: 'week' | 'month' | 'quarter' = 'month') {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tickets = await this.ticketRepository.find({
      where: { type: TicketType.INCIDENT, createdAt: Between(startDate, new Date()) },
      select: ['id', 'createdAt', 'resolvedAt', 'priority', 'category', 'status'],
    });

    // Group by week or day
    const grouped: Record<string, any> = {};
    tickets.forEach(t => {
      const key = t.createdAt.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = { date: key, total: 0, resolved: 0, byPriority: {} };
      grouped[key].total++;
      if (t.resolvedAt) grouped[key].resolved++;
      const p = t.priority;
      grouped[key].byPriority[p] = (grouped[key].byPriority[p] || 0) + 1;
    });

    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }

  async getAgentProductivity(startDate: Date, endDate: Date) {
    const tickets = await this.ticketRepository.find({
      where: { createdAt: Between(startDate, endDate) },
      select: ['id', 'assigneeId', 'status', 'resolvedAt', 'createdAt', 'priority'],
    });

    const agentMap: Record<string, any> = {};
    tickets.forEach(t => {
      if (!t.assigneeId) return;
      if (!agentMap[t.assigneeId]) {
        agentMap[t.assigneeId] = { agentId: t.assigneeId, assigned: 0, resolved: 0, avgResolutionHours: 0, resolutionTimes: [] };
      }
      agentMap[t.assigneeId].assigned++;
      if (t.resolvedAt) {
        agentMap[t.assigneeId].resolved++;
        const hours = (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / 3600000;
        agentMap[t.assigneeId].resolutionTimes.push(hours);
      }
    });

    return Object.values(agentMap).map((a: any) => ({
      ...a,
      avgResolutionHours: a.resolutionTimes.length > 0
        ? Math.round(a.resolutionTimes.reduce((s: number, v: number) => s + v, 0) / a.resolutionTimes.length * 10) / 10
        : 0,
      resolutionRate: a.assigned > 0 ? Math.round((a.resolved / a.assigned) * 100) : 0,
      resolutionTimes: undefined,
    }));
  }

  async generateAiReport(reportType: string, data: any): Promise<string> {
    const prompt = `Generate a concise executive summary report for ${reportType} based on this data: ${JSON.stringify(data, null, 2)}. Include key findings, trends, and recommendations.`;
    const response = await this.aiService.chatWithAgent([{ role: 'user', content: prompt }]);
    return response;
  }

  async getCategoryReport(startDate: Date, endDate: Date) {
    return this.ticketRepository
      .createQueryBuilder('t')
      .select('t.category', 'category')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN t.status = :resolved THEN 1 ELSE 0 END)', 'resolved')
      .where('t.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('t.category IS NOT NULL')
      .setParameter('resolved', TicketStatus.RESOLVED)
      .groupBy('t.category')
      .orderBy('total', 'DESC')
      .getRawMany();
  }
}
