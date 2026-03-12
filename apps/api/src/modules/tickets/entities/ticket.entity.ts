import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum TicketType {
  INCIDENT = 'incident',
  SERVICE_REQUEST = 'service_request',
  PROBLEM = 'problem',
  CHANGE = 'change',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum TicketPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ChangeRisk {
  VERY_HIGH = 'very_high',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('tickets')
@Index(['type', 'status'])
@Index(['assigneeId'])
@Index(['createdAt'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  number: string;

  @Column({ type: 'enum', enum: TicketType })
  type: TicketType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ nullable: true })
  urgency: string;

  @Column({ nullable: true })
  impact: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ nullable: true })
  affectedService: string;

  @Column({ nullable: true })
  assigneeId: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @Column({ nullable: true })
  reporterId: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({ nullable: true })
  groupId: string;

  @Column({ nullable: true })
  slaBreachAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ type: 'text', nullable: true })
  aiSummary: string;

  @Column({ type: 'text', nullable: true })
  aiRootCause: string;

  @Column({ nullable: true })
  aiSuggestedPriority: string;

  @Column({ nullable: true })
  aiSentiment: string;

  @Column({ type: 'float', nullable: true })
  aiSentimentScore: number;

  @Column({ nullable: true })
  aiCategory: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  aiSimilarTickets: any[];

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  worklogs: Worklog[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  comments: Comment[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  attachments: Attachment[];

  // Change-specific fields
  @Column({ nullable: true })
  changeType: string;

  @Column({ type: 'enum', enum: ChangeRisk, nullable: true })
  changeRisk: ChangeRisk;

  @Column({ nullable: true })
  changeRiskScore: number;

  @Column({ nullable: true })
  scheduledStartAt: Date;

  @Column({ nullable: true })
  scheduledEndAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  approvals: any[];

  // Problem-specific
  @Column({ nullable: true })
  problemState: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  linkedIncidents: string[];

  @Column({ nullable: true })
  knownError: boolean;

  @Column({ type: 'text', nullable: true })
  workaround: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface Worklog {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timeSpentMinutes: number;
  isPublic: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}
