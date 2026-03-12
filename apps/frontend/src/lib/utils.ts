import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  return format(new Date(date), fmt)
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy HH:mm')
}

export function getSlaStatus(slaBreachAt: string | null): 'ok' | 'warning' | 'breached' | 'none' {
  if (!slaBreachAt) return 'none'
  const minutesLeft = differenceInMinutes(new Date(slaBreachAt), new Date())
  if (minutesLeft < 0) return 'breached'
  if (minutesLeft < 30) return 'warning'
  return 'ok'
}

export function getSlaTimeLeft(slaBreachAt: string | null): string {
  if (!slaBreachAt) return 'No SLA'
  const minutesLeft = differenceInMinutes(new Date(slaBreachAt), new Date())
  if (minutesLeft < 0) {
    const abs = Math.abs(minutesLeft)
    if (abs >= 60) return `${Math.floor(abs / 60)}h overdue`
    return `${abs}m overdue`
  }
  if (minutesLeft >= 60) {
    const h = Math.floor(minutesLeft / 60)
    const m = minutesLeft % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  return `${minutesLeft}m`
}

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-500' },
  low: { label: 'Low', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
} as const

export const STATUS_CONFIG = {
  open: { label: 'Open', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', dot: 'bg-purple-500' },
  pending: { label: 'Pending', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30', dot: 'bg-yellow-500' },
  resolved: { label: 'Resolved', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', dot: 'bg-green-500' },
  closed: { label: 'Closed', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/50', dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/50', dot: 'bg-gray-300' },
} as const

export const TYPE_CONFIG = {
  incident: { label: 'Incident', prefix: 'INC', color: 'text-red-600 dark:text-red-400' },
  service_request: { label: 'Request', prefix: 'REQ', color: 'text-blue-600 dark:text-blue-400' },
  problem: { label: 'Problem', prefix: 'PRB', color: 'text-orange-600 dark:text-orange-400' },
  change: { label: 'Change', prefix: 'CHG', color: 'text-purple-600 dark:text-purple-400' },
} as const

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function truncate(str: string, len = 80): string {
  return str.length > len ? str.slice(0, len) + '...' : str
}
