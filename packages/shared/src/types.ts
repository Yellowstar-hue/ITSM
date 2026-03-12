// ─── Enums ────────────────────────────────────────────────────────────────────

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

export enum UserRole {
  ADMIN = 'admin',
  AGENT = 'agent',
  MANAGER = 'manager',
  VIEWER = 'viewer',
}

export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum CIType {
  SERVER = 'server',
  DATABASE = 'database',
  APPLICATION = 'application',
  NETWORK_DEVICE = 'network_device',
  STORAGE = 'storage',
  VIRTUAL_MACHINE = 'virtual_machine',
  CONTAINER = 'container',
  SERVICE = 'service',
  ENDPOINT = 'endpoint',
  OTHER = 'other',
}

export enum CIStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DECOMMISSIONED = 'decommissioned',
}

// ─── Core Interfaces ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  number: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  title: string;
  description: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  assigneeId?: string;
  assignee?: User;
  requesterId?: string;
  requester?: User;
  groupId?: string;
  slaDeadline?: string;
  slaBreached?: boolean;
  resolvedAt?: string;
  closedAt?: string;
  aiPriority?: string;
  aiCategory?: string;
  aiSentiment?: string;
  aiSuggestedGroup?: string;
  aiTags?: string[];
  aiSimilarTickets?: string[];
  worklogs?: Worklog[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Worklog {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timeSpentMinutes?: number;
  isInternal: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  status: ArticleStatus;
  authorId: string;
  author?: User;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedTicketId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationItem {
  id: string;
  name: string;
  type: CIType;
  status: CIStatus;
  description?: string;
  ipAddress?: string;
  hostname?: string;
  operatingSystem?: string;
  version?: string;
  owner?: string;
  department?: string;
  location?: string;
  environment?: string;
  tags?: string[];
  attributes?: Record<string, any>;
  relationships?: CIRelationship[];
  createdAt: string;
  updatedAt: string;
}

export interface CIRelationship {
  type: string;
  ciId: string;
  ciName: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  slaHours: number;
  price?: number;
  isActive: boolean;
  formFields?: FormField[];
  requestCount: number;
  avgRating?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  trigger: {
    type: string;
    config?: Record<string, any>;
  };
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
  executionCount: number;
  successCount: number;
  failureCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
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

// ─── API Response Types ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// ─── Dashboard Types ────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  openIncidents: number;
  criticalIncidents: number;
  openRequests: number;
  slaCompliance: number;
  avgResolutionHours: number;
  ticketsCreatedToday: number;
  ticketsResolvedToday: number;
  activeAgents: number;
}

export interface TrendData {
  date: string;
  created: number;
  resolved: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
  percentage: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

// ─── WebSocket Event Types ─────────────────────────────────────────────────────

export interface WsTicketEvent {
  type: 'created' | 'updated' | 'assigned' | 'resolved' | 'closed';
  ticket: Ticket;
}

export interface WsNotificationEvent {
  notification: Notification;
}

export interface WsMetricUpdate {
  metrics: Partial<DashboardMetrics>;
}
