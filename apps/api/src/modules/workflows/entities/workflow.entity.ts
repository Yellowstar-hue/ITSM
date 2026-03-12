import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn
} from 'typeorm';

export enum WorkflowTriggerType {
  TICKET_CREATED = 'ticket.created',
  TICKET_UPDATED = 'ticket.updated',
  TICKET_ASSIGNED = 'ticket.assigned',
  SLA_BREACH_IMMINENT = 'sla.breach_imminent',
  SCHEDULE = 'schedule',
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
}

export enum WorkflowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: WorkflowStatus, default: WorkflowStatus.DRAFT })
  status: WorkflowStatus;

  @Column({ type: 'jsonb' })
  trigger: WorkflowTrigger;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  conditions: WorkflowCondition[];

  @Column({ type: 'jsonb', default: [] })
  actions: WorkflowAction[];

  @Column({ default: 0 })
  executionCount: number;

  @Column({ default: 0 })
  successCount: number;

  @Column({ default: 0 })
  failureCount: number;

  @Column({ nullable: true })
  lastExecutedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  executionLog: WorkflowExecution[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config?: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: string;
  order: number;
  config: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  triggeredAt: string;
  status: 'success' | 'failure';
  duration: number;
  error?: string;
}
