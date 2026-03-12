import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Workflow, WorkflowStatus, WorkflowTriggerType } from './entities/workflow.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow) private workflowRepository: Repository<Workflow>,
  ) {}

  async findAll(query: { status?: WorkflowStatus; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const where: any = {};
    if (status) where.status = status;
    const [items, total] = await this.workflowRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<Workflow> {
    const wf = await this.workflowRepository.findOne({ where: { id } });
    if (!wf) throw new NotFoundException('Workflow not found');
    return wf;
  }

  async create(data: Partial<Workflow>): Promise<Workflow> {
    const wf = this.workflowRepository.create(data);
    return this.workflowRepository.save(wf);
  }

  async update(id: string, data: Partial<Workflow>): Promise<Workflow> {
    await this.workflowRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const wf = await this.findOne(id);
    await this.workflowRepository.remove(wf);
  }

  async activate(id: string): Promise<Workflow> {
    return this.update(id, { status: WorkflowStatus.ACTIVE });
  }

  async deactivate(id: string): Promise<Workflow> {
    return this.update(id, { status: WorkflowStatus.INACTIVE });
  }

  @OnEvent('ticket.created')
  async onTicketCreated(ticket: any) {
    await this.executeWorkflowsForTrigger(WorkflowTriggerType.TICKET_CREATED, ticket);
  }

  @OnEvent('ticket.updated')
  async onTicketUpdated(payload: any) {
    await this.executeWorkflowsForTrigger(WorkflowTriggerType.TICKET_UPDATED, payload.ticket);
  }

  private async executeWorkflowsForTrigger(triggerType: WorkflowTriggerType, data: any) {
    const workflows = await this.workflowRepository.find({
      where: { status: WorkflowStatus.ACTIVE },
    });

    const applicable = workflows.filter(wf => wf.trigger?.type === triggerType);
    for (const wf of applicable) {
      await this.executeWorkflow(wf, data);
    }
  }

  private async executeWorkflow(workflow: Workflow, data: any) {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;

    try {
      // Check conditions
      const conditionsMet = this.evaluateConditions(workflow.conditions || [], data);
      if (!conditionsMet) return;

      // Execute actions
      for (const action of workflow.actions || []) {
        await this.executeAction(action, data);
      }
    } catch (e) {
      success = false;
      error = e.message;
    }

    const execution = {
      id: uuidv4(),
      triggeredAt: new Date().toISOString(),
      status: success ? 'success' as const : 'failure' as const,
      duration: Date.now() - startTime,
      error,
    };

    const log = [...(workflow.executionLog || []).slice(-49), execution];
    await this.workflowRepository.update(workflow.id, {
      executionCount: workflow.executionCount + 1,
      successCount: success ? workflow.successCount + 1 : workflow.successCount,
      failureCount: !success ? workflow.failureCount + 1 : workflow.failureCount,
      lastExecutedAt: new Date(),
      executionLog: log,
    });
  }

  private evaluateConditions(conditions: any[], data: any): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(condition => {
      const fieldValue = data[condition.field];
      switch (condition.operator) {
        case 'equals': return fieldValue === condition.value;
        case 'not_equals': return fieldValue !== condition.value;
        case 'contains': return String(fieldValue).includes(condition.value);
        case 'in': return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        default: return true;
      }
    });
  }

  private async executeAction(action: any, data: any) {
    // Action execution (logged for now, real integrations would call external services)
    switch (action.type) {
      case 'send_notification':
      case 'assign_ticket':
      case 'update_field':
      case 'create_ticket':
      case 'send_email':
      case 'call_webhook':
        // Implementations would call respective services
        break;
    }
  }
}
