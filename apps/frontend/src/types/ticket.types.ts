export type TicketType = 'incident' | 'service_request' | 'problem' | 'change'
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed' | 'cancelled'
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low'

export interface Ticket {
  id: string
  number: string
  type: TicketType
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  urgency?: string
  impact?: string
  category?: string
  subcategory?: string
  affectedService?: string
  assigneeId?: string
  assignee?: User
  reporterId?: string
  reporter?: User
  slaBreachAt?: string
  resolvedAt?: string
  closedAt?: string
  aiSummary?: string
  aiRootCause?: string
  aiSuggestedPriority?: string
  aiSentiment?: string
  aiSentimentScore?: number
  aiCategory?: string
  aiSimilarTickets?: any[]
  tags?: string[]
  worklogs?: Worklog[]
  comments?: Comment[]
  attachments?: Attachment[]
  changeType?: string
  changeRisk?: string
  changeRiskScore?: number
  scheduledStartAt?: string
  scheduledEndAt?: string
  linkedIncidents?: string[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  department?: string
  title?: string
  avatar?: string
}

export interface Worklog {
  id: string
  authorId: string
  authorName: string
  content: string
  timeSpentMinutes: number
  isPublic: boolean
  createdAt: string
}

export interface Comment {
  id: string
  authorId: string
  authorName: string
  content: string
  isInternal: boolean
  createdAt: string
}

export interface Attachment {
  id: string
  filename: string
  url: string
  size: number
  mimeType: string
  uploadedBy: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}
