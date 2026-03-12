import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, In, MoreThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Ticket, TicketType, TicketStatus, TicketPriority, Worklog, Comment } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AiService } from '../ai/ai.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);
  private readonly counters: Record<string, number> = { incident: 0, service_request: 0, problem: 0, change: 0 };

  constructor(
    @InjectRepository(Ticket) private ticketRepository: Repository<Ticket>,
    private eventEmitter: EventEmitter2,
    private aiService: AiService,
  ) {
    this.loadCounters();
  }

  private async loadCounters() {
    for (const type of Object.values(TicketType)) {
      const count = await this.ticketRepository.count({ where: { type } });
      this.counters[type] = count;
    }
  }

  private generateNumber(type: TicketType): string {
    this.counters[type] = (this.counters[type] || 0) + 1;
    const prefix = type === TicketType.INCIDENT ? 'INC' :
                   type === TicketType.SERVICE_REQUEST ? 'REQ' :
                   type === TicketType.PROBLEM ? 'PRB' : 'CHG';
    return `${prefix}-${String(this.counters[type]).padStart(4, '0')}`;
  }

  private calculateSlaBreachAt(priority: TicketPriority, type: TicketType): Date {
    const hoursMap: Record<TicketPriority, number> = {
      [TicketPriority.CRITICAL]: 1,
      [TicketPriority.HIGH]: 4,
      [TicketPriority.MEDIUM]: 8,
      [TicketPriority.LOW]: 24,
    };
    const hours = hoursMap[priority] || 8;
    const slaDate = new Date();
    slaDate.setHours(slaDate.getHours() + hours);
    return slaDate;
  }

  async create(createTicketDto: CreateTicketDto, reporterId: string): Promise<Ticket> {
    // Run AI triage
    let aiTriage: any = null;
    try {
      aiTriage = await this.aiService.triageTicket({
        title: createTicketDto.title,
        description: createTicketDto.description,
        type: createTicketDto.type,
      });
    } catch (e) {
      this.logger.warn('AI triage failed, proceeding without AI data');
    }

    const priority = createTicketDto.priority ||
      (aiTriage?.priority as TicketPriority) || TicketPriority.MEDIUM;

    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      number: this.generateNumber(createTicketDto.type),
      reporterId,
      priority,
      status: TicketStatus.OPEN,
      slaBreachAt: this.calculateSlaBreachAt(priority, createTicketDto.type),
      category: createTicketDto.category || aiTriage?.category,
      aiSuggestedPriority: aiTriage?.priority,
      aiSentiment: aiTriage?.sentiment,
      aiSentimentScore: aiTriage?.sentimentScore,
      aiCategory: aiTriage?.category,
      aiSummary: aiTriage?.summary,
      tags: createTicketDto.tags || aiTriage?.tags || [],
      worklogs: [],
      comments: [],
      attachments: [],
    });

    const saved = await this.ticketRepository.save(ticket);
    this.eventEmitter.emit('ticket.created', saved);
    return saved;
  }

  async findAll(query: {
    type?: TicketType;
    status?: TicketStatus;
    priority?: TicketPriority;
    assigneeId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const { type, status, priority, assigneeId, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) where.title = Like(`%${search}%`);

    const [items, total] = await this.ticketRepository.findAndCount({
      where,
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async findByNumber(number: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { number } });
    if (!ticket) throw new NotFoundException(`Ticket ${number} not found`);
    return ticket;
  }

  async update(id: string, updateDto: UpdateTicketDto, userId: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const oldStatus = ticket.status;

    Object.assign(ticket, updateDto);

    if (updateDto.status === TicketStatus.RESOLVED && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }
    if (updateDto.status === TicketStatus.CLOSED && !ticket.closedAt) {
      ticket.closedAt = new Date();
    }

    const updated = await this.ticketRepository.save(ticket);
    this.eventEmitter.emit('ticket.updated', { ticket: updated, oldStatus, userId });
    return updated;
  }

  async assign(id: string, assigneeId: string, userId: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    ticket.assigneeId = assigneeId;
    if (ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }
    const updated = await this.ticketRepository.save(ticket);
    this.eventEmitter.emit('ticket.assigned', { ticket: updated, assigneeId, userId });
    return updated;
  }

  async addWorklog(id: string, content: string, timeSpentMinutes: number, userId: string, userName: string, isPublic = true): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const worklog: Worklog = {
      id: uuidv4(),
      authorId: userId,
      authorName: userName,
      content,
      timeSpentMinutes,
      isPublic,
      createdAt: new Date().toISOString(),
    };
    ticket.worklogs = [...(ticket.worklogs || []), worklog];
    return this.ticketRepository.save(ticket);
  }

  async addComment(id: string, content: string, userId: string, userName: string, isInternal = false): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const comment: Comment = {
      id: uuidv4(),
      authorId: userId,
      authorName: userName,
      content,
      isInternal,
      createdAt: new Date().toISOString(),
    };
    ticket.comments = [...(ticket.comments || []), comment];
    const updated = await this.ticketRepository.save(ticket);
    this.eventEmitter.emit('ticket.commented', { ticket: updated, comment });
    return updated;
  }

  async runAiTriage(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const triage = await this.aiService.triageTicket({
      title: ticket.title,
      description: ticket.description,
      type: ticket.type,
    });
    ticket.aiSuggestedPriority = triage.priority;
    ticket.aiSentiment = triage.sentiment;
    ticket.aiSentimentScore = triage.sentimentScore;
    ticket.aiCategory = triage.category;
    ticket.aiSummary = triage.summary;
    return this.ticketRepository.save(ticket);
  }

  async getSimilarTickets(id: string): Promise<any[]> {
    const ticket = await this.findOne(id);
    const allTickets = await this.ticketRepository.find({
      where: { type: ticket.type },
      select: ['id', 'number', 'title', 'description', 'status', 'priority', 'category'],
      take: 100,
    });
    const others = allTickets.filter(t => t.id !== id);
    return this.aiService.detectSimilarTickets(ticket.title, ticket.description, others);
  }

  async getStats() {
    const [open, inProgress, resolved, critical, slaBreached] = await Promise.all([
      this.ticketRepository.count({ where: { status: TicketStatus.OPEN } }),
      this.ticketRepository.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      this.ticketRepository.count({ where: { status: TicketStatus.RESOLVED } }),
      this.ticketRepository.count({ where: { priority: TicketPriority.CRITICAL, status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]) } }),
      this.ticketRepository.count({
        where: {
          status: In([TicketStatus.OPEN, TicketStatus.IN_PROGRESS]),
          slaBreachAt: MoreThan(new Date(0)),
        }
      }),
    ]);

    return { open, inProgress, resolved, critical, slaBreached };
  }

  async delete(id: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
  }

  async bulkUpdate(ids: string[], updates: Partial<Ticket>, userId: string): Promise<number> {
    if (ids.length === 0) return 0;
    await this.ticketRepository.update({ id: In(ids) }, updates);
    return ids.length;
  }
}
