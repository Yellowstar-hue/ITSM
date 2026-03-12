import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notificationRepository: Repository<Notification>,
  ) {}

  async getForUser(userId: string, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;
    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.notificationRepository.update({ id, userId }, { isRead: true, readAt: new Date() });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    return this.notificationRepository.save(notification);
  }

  @OnEvent('ticket.assigned')
  async onTicketAssigned(payload: { ticket: any; assigneeId: string; userId: string }) {
    if (payload.assigneeId && payload.assigneeId !== payload.userId) {
      await this.create({
        userId: payload.assigneeId,
        type: NotificationType.TICKET_ASSIGNED,
        title: 'Ticket Assigned to You',
        message: `${payload.ticket.number}: ${payload.ticket.title}`,
        ticketId: payload.ticket.id,
        ticketNumber: payload.ticket.number,
        actionUrl: `/incidents/${payload.ticket.id}`,
      });
    }
  }

  @OnEvent('ticket.created')
  async onTicketCreated(ticket: any) {
    if (ticket.priority === 'critical' && ticket.assigneeId) {
      await this.create({
        userId: ticket.assigneeId,
        type: NotificationType.TICKET_ASSIGNED,
        title: '🚨 CRITICAL Ticket Assigned',
        message: `${ticket.number}: ${ticket.title} - Requires immediate attention`,
        ticketId: ticket.id,
        ticketNumber: ticket.number,
      });
    }
  }
}
