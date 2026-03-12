import { TicketPriority, TicketStatus, TicketType } from './types';

// ─── SLA Configuration ─────────────────────────────────────────────────────────

export const SLA_HOURS: Record<TicketPriority, number> = {
  [TicketPriority.CRITICAL]: 1,
  [TicketPriority.HIGH]: 4,
  [TicketPriority.MEDIUM]: 8,
  [TicketPriority.LOW]: 24,
};

// ─── Priority Config ───────────────────────────────────────────────────────────

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  [TicketPriority.CRITICAL]: 'Critical',
  [TicketPriority.HIGH]: 'High',
  [TicketPriority.MEDIUM]: 'Medium',
  [TicketPriority.LOW]: 'Low',
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  [TicketPriority.CRITICAL]: '#ef4444',
  [TicketPriority.HIGH]: '#f97316',
  [TicketPriority.MEDIUM]: '#eab308',
  [TicketPriority.LOW]: '#22c55e',
};

// ─── Status Config ─────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'Open',
  [TicketStatus.IN_PROGRESS]: 'In Progress',
  [TicketStatus.PENDING]: 'Pending',
  [TicketStatus.RESOLVED]: 'Resolved',
  [TicketStatus.CLOSED]: 'Closed',
  [TicketStatus.CANCELLED]: 'Cancelled',
};

// ─── Ticket Type Config ────────────────────────────────────────────────────────

export const TYPE_LABELS: Record<TicketType, string> = {
  [TicketType.INCIDENT]: 'Incident',
  [TicketType.SERVICE_REQUEST]: 'Service Request',
  [TicketType.PROBLEM]: 'Problem',
  [TicketType.CHANGE]: 'Change',
};

export const TYPE_PREFIXES: Record<TicketType, string> = {
  [TicketType.INCIDENT]: 'INC',
  [TicketType.SERVICE_REQUEST]: 'REQ',
  [TicketType.PROBLEM]: 'PRB',
  [TicketType.CHANGE]: 'CHG',
};

// ─── Pagination ────────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── Categories ────────────────────────────────────────────────────────────────

export const TICKET_CATEGORIES = [
  'Hardware',
  'Software',
  'Network',
  'Security',
  'Access Management',
  'Email',
  'Database',
  'Application',
  'Infrastructure',
  'Other',
] as const;

export const KNOWLEDGE_CATEGORIES = [
  'How-To',
  'Troubleshooting',
  'Policy',
  'FAQ',
  'Release Notes',
  'Best Practices',
] as const;

// ─── WebSocket Events ──────────────────────────────────────────────────────────

export const WS_EVENTS = {
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_ASSIGNED: 'ticket.assigned',
  TICKET_RESOLVED: 'ticket.resolved',
  NOTIFICATION_NEW: 'notification.new',
  METRIC_UPDATE: 'metric.update',
  JOIN_TICKET: 'join:ticket',
  LEAVE_TICKET: 'leave:ticket',
} as const;

// ─── AI Config ─────────────────────────────────────────────────────────────────

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
} as const;

export const AI_MODELS = {
  OPENAI: {
    GPT4O: 'gpt-4o',
    GPT4O_MINI: 'gpt-4o-mini',
    EMBEDDING: 'text-embedding-3-small',
  },
  ANTHROPIC: {
    CLAUDE_SONNET: 'claude-sonnet-4-6',
    CLAUDE_HAIKU: 'claude-haiku-4-5-20251001',
  },
} as const;
