import { TicketPriority, TicketStatus } from './types';
import { SLA_HOURS } from './constants';

// ─── Date Utilities ────────────────────────────────────────────────────────────

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

// ─── SLA Utilities ─────────────────────────────────────────────────────────────

export function calculateSlaDeadline(priority: TicketPriority, createdAt: string): Date {
  const created = new Date(createdAt);
  const hours = SLA_HOURS[priority];
  return new Date(created.getTime() + hours * 60 * 60 * 1000);
}

export type SlaStatus = 'breached' | 'warning' | 'ok' | 'none';

export function getSlaStatus(slaDeadline?: string, status?: TicketStatus): SlaStatus {
  if (!slaDeadline) return 'none';
  if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED || status === TicketStatus.CANCELLED) {
    return 'none';
  }
  const now = new Date();
  const deadline = new Date(slaDeadline);
  const minutesLeft = (deadline.getTime() - now.getTime()) / 60000;

  if (minutesLeft <= 0) return 'breached';
  if (minutesLeft <= 30) return 'warning';
  return 'ok';
}

export function getSlaTimeLeft(slaDeadline?: string): string {
  if (!slaDeadline) return '';
  const now = new Date();
  const deadline = new Date(slaDeadline);
  const minutesLeft = Math.floor((deadline.getTime() - now.getTime()) / 60000);

  if (minutesLeft <= 0) {
    const minutesOver = Math.abs(minutesLeft);
    if (minutesOver < 60) return `-${minutesOver}m`;
    return `-${Math.floor(minutesOver / 60)}h`;
  }
  if (minutesLeft < 60) return `${minutesLeft}m`;
  const hours = Math.floor(minutesLeft / 60);
  const mins = minutesLeft % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// ─── String Utilities ──────────────────────────────────────────────────────────

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Number Utilities ──────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
