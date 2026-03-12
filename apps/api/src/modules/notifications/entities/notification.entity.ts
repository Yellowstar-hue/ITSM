import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index
} from 'typeorm';

export enum NotificationType {
  TICKET_ASSIGNED = 'ticket_assigned',
  TICKET_UPDATED = 'ticket_updated',
  TICKET_RESOLVED = 'ticket_resolved',
  SLA_WARNING = 'sla_warning',
  SLA_BREACH = 'sla_breach',
  MENTION = 'mention',
  APPROVAL_NEEDED = 'approval_needed',
  SYSTEM = 'system',
}

@Entity('notifications')
@Index(['userId', 'isRead'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ nullable: true })
  ticketId: string;

  @Column({ nullable: true })
  ticketNumber: string;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
