import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../modules/auth/entities/user.entity';
import { Ticket, TicketType, TicketStatus, TicketPriority } from '../modules/tickets/entities/ticket.entity';
import { Article, ArticleStatus } from '../modules/knowledge/entities/article.entity';
import { ConfigurationItem, CIType, CIStatus } from '../modules/cmdb/entities/ci.entity';
import { Workflow, WorkflowStatus, WorkflowTriggerType } from '../modules/workflows/entities/workflow.entity';
import { CatalogItem } from '../modules/catalog/entities/catalog-item.entity';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(ConfigurationItem) private ciRepo: Repository<ConfigurationItem>,
    @InjectRepository(Workflow) private wfRepo: Repository<Workflow>,
    @InjectRepository(CatalogItem) private catalogRepo: Repository<CatalogItem>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const userCount = await this.userRepo.count();
      if (userCount > 0) {
        this.logger.log('Database already seeded, skipping.');
        return;
      }
      this.logger.log('Empty database detected. Seeding demo data...');
      await this.seed();
      this.logger.log('Database seeded successfully!');
    } catch (err) {
      this.logger.error('Seeding failed:', err);
    }
  }

  private async seed() {
    const pwHash = await bcrypt.hash('admin123', 12);

    const users = await this.userRepo.save([
      { email: 'admin@simplenow.io', firstName: 'Alex', lastName: 'Admin', passwordHash: pwHash, role: UserRole.ADMIN, department: 'IT', title: 'IT Director', isActive: true },
      { email: 'sarah.agent@simplenow.io', firstName: 'Sarah', lastName: 'Chen', passwordHash: pwHash, role: UserRole.AGENT, department: 'IT Support', title: 'Senior IT Analyst', isActive: true },
      { email: 'james.agent@simplenow.io', firstName: 'James', lastName: 'Wilson', passwordHash: pwHash, role: UserRole.AGENT, department: 'Network Team', title: 'Network Engineer', isActive: true },
      { email: 'priya.agent@simplenow.io', firstName: 'Priya', lastName: 'Patel', passwordHash: pwHash, role: UserRole.AGENT, department: 'Security', title: 'Security Analyst', isActive: true },
      { email: 'viewer@simplenow.io', firstName: 'Bob', lastName: 'Viewer', passwordHash: pwHash, role: UserRole.VIEWER, department: 'Operations', title: 'Operations Manager', isActive: true },
    ]);
    this.logger.log(`Created ${users.length} users`);

    const now = new Date();
    const ticketData = [
      { number: 'INC-0001', type: TicketType.INCIDENT, title: 'Production database cluster is down - all services affected', description: 'The primary database cluster has failed. All production services are experiencing downtime. Approximately 500 users affected.', status: TicketStatus.IN_PROGRESS, priority: TicketPriority.CRITICAL, category: 'Infrastructure', affectedService: 'Database', assigneeId: users[1].id, reporterId: users[0].id, aiSentiment: 'urgent', aiSentimentScore: 0.95, aiSummary: 'Critical database outage affecting all production services.', tags: ['database', 'outage', 'production', 'critical'], slaBreachAt: new Date(now.getTime() + 30 * 60000) },
      { number: 'INC-0002', type: TicketType.INCIDENT, title: 'VPN service degraded - remote workers cannot connect', description: 'Multiple remote workers are reporting inability to connect to the corporate VPN.', status: TicketStatus.OPEN, priority: TicketPriority.HIGH, category: 'Network', affectedService: 'VPN', assigneeId: users[2].id, reporterId: users[0].id, aiSentiment: 'frustrated', aiSentimentScore: 0.7, tags: ['vpn', 'network', 'remote-access'], slaBreachAt: new Date(now.getTime() + 2 * 3600000) },
      { number: 'INC-0003', type: TicketType.INCIDENT, title: 'Email server not delivering messages for the past 2 hours', description: 'Users are reporting that emails are not being delivered.', status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH, category: 'Email & Collaboration', affectedService: 'Email', assigneeId: users[1].id, reporterId: users[4].id, aiSentiment: 'frustrated', aiSentimentScore: 0.65, tags: ['email', 'communication'], slaBreachAt: new Date(now.getTime() + 1.5 * 3600000) },
      { number: 'INC-0004', type: TicketType.INCIDENT, title: 'Cannot login to Salesforce CRM - getting 503 error', description: 'Our Salesforce org is returning 503 errors for all users.', status: TicketStatus.OPEN, priority: TicketPriority.CRITICAL, category: 'Application', affectedService: 'Salesforce CRM', reporterId: users[4].id, aiSentiment: 'urgent', aiSentimentScore: 0.9, tags: ['salesforce', 'crm', 'access'], slaBreachAt: new Date(now.getTime() + 45 * 60000) },
      { number: 'INC-0005', type: TicketType.INCIDENT, title: 'WiFi intermittently dropping in Building A conference rooms', description: 'Conference rooms 3A, 3B, and 4C are experiencing intermittent WiFi drops.', status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, category: 'Network', affectedService: 'WiFi', assigneeId: users[2].id, reporterId: users[4].id, aiSentiment: 'neutral', aiSentimentScore: 0.3, tags: ['wifi', 'network', 'building-a'], slaBreachAt: new Date(now.getTime() + 6 * 3600000) },
      { number: 'INC-0006', type: TicketType.INCIDENT, title: "User's laptop won't turn on after Windows update", description: "Laptop failed to boot after installing Windows update KB5034441.", status: TicketStatus.RESOLVED, priority: TicketPriority.MEDIUM, category: 'Hardware', affectedService: 'Endpoint', assigneeId: users[1].id, reporterId: users[0].id, resolvedAt: new Date(now.getTime() - 2 * 3600000), tags: ['laptop', 'windows-update', 'hardware'] },
      { number: 'INC-0007', type: TicketType.INCIDENT, title: 'Suspicious login attempt detected from foreign IP', description: 'Security monitoring detected 47 failed login attempts from foreign IP targeting admin accounts.', status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH, category: 'Security', assigneeId: users[3].id, reporterId: users[0].id, aiSentiment: 'urgent', aiSentimentScore: 0.85, tags: ['security', 'breach-attempt', 'login'] },
      { number: 'INC-0008', type: TicketType.INCIDENT, title: 'Printer in Finance department printing garbled text', description: 'The HP LaserJet in Finance is printing garbled characters.', status: TicketStatus.OPEN, priority: TicketPriority.LOW, category: 'Hardware', tags: ['printer', 'hardware'], slaBreachAt: new Date(now.getTime() + 20 * 3600000) },
      { number: 'REQ-0001', type: TicketType.SERVICE_REQUEST, title: 'Request new MacBook Pro for new hire - Marketing team', description: 'New hire needs MacBook Pro 14" M3, 16GB RAM, 512GB SSD.', status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, category: 'Hardware Provisioning', assigneeId: users[1].id, reporterId: users[4].id, tags: ['hardware', 'new-hire', 'macbook'] },
      { number: 'REQ-0002', type: TicketType.SERVICE_REQUEST, title: 'Access request: Adobe Creative Cloud for design team', description: 'The design team (5 members) requires Adobe Creative Cloud licenses.', status: TicketStatus.PENDING, priority: TicketPriority.LOW, category: 'Software Licensing', reporterId: users[4].id, tags: ['adobe', 'software', 'license'] },
      { number: 'REQ-0003', type: TicketType.SERVICE_REQUEST, title: 'Set up Microsoft 365 for new employee David Park', description: 'Create M365 account, assign E3 license, add to Engineering distribution lists.', status: TicketStatus.IN_PROGRESS, priority: TicketPriority.MEDIUM, category: 'Access Management', assigneeId: users[1].id, reporterId: users[0].id, tags: ['m365', 'new-hire', 'access'] },
      { number: 'PRB-0001', type: TicketType.PROBLEM, title: 'Recurring VPN disconnections - pattern analysis needed', description: 'Over the past 3 weeks, there have been 12 VPN-related incidents.', status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH, category: 'Network', assigneeId: users[2].id, reporterId: users[0].id, aiRootCause: 'Analysis suggests the FortiGate VPN concentrator has a memory leak in firmware version 7.2.4.', linkedIncidents: ['INC-0002'], tags: ['vpn', 'problem', 'pattern'] },
      { number: 'PRB-0002', type: TicketType.PROBLEM, title: 'Database performance degradation pattern - 8 incidents in 2 weeks', description: 'Multiple database slow-query incidents have been raised.', status: TicketStatus.OPEN, priority: TicketPriority.HIGH, category: 'Infrastructure', reporterId: users[0].id, linkedIncidents: ['INC-0001'], tags: ['database', 'performance', 'problem'] },
      { number: 'CHG-0001', type: TicketType.CHANGE, title: 'Upgrade PostgreSQL from 14.x to 16.x on production cluster', description: 'Major version upgrade to address security vulnerabilities and performance improvements.', status: TicketStatus.PENDING, priority: TicketPriority.HIGH, category: 'Infrastructure', changeType: 'major', changeRisk: 'high' as any, changeRiskScore: 68, assigneeId: users[1].id, reporterId: users[0].id, scheduledStartAt: new Date(now.getTime() + 7 * 24 * 3600000), scheduledEndAt: new Date(now.getTime() + 7 * 24 * 3600000 + 4 * 3600000), tags: ['database', 'upgrade', 'postgresql'] },
      { number: 'CHG-0002', type: TicketType.CHANGE, title: 'Deploy new API gateway configuration for rate limiting', description: 'Add rate limiting rules to prevent API abuse.', status: TicketStatus.OPEN, priority: TicketPriority.MEDIUM, category: 'Application', changeType: 'minor', changeRisk: 'low' as any, changeRiskScore: 22, assigneeId: users[2].id, reporterId: users[0].id, tags: ['api', 'rate-limiting', 'security'] },
    ];

    const tickets = await this.ticketRepo.save(
      ticketData.map(t => this.ticketRepo.create({ ...t, worklogs: [], comments: [], attachments: [] }))
    );
    this.logger.log(`Created ${tickets.length} tickets`);

    const articles = await this.articleRepo.save([
      { title: 'How to Reset Your VPN Password', content: '## Problem\nYou\'ve forgotten your VPN password or it has expired.\n\n## Solution\n\n1. Navigate to the VPN reset portal\n2. Enter your corporate email address\n3. Check your email for the reset link (valid for 15 minutes)\n4. Follow the link to create a new password', summary: 'Step-by-step guide to reset VPN credentials.', category: 'Network', tags: ['vpn', 'password', 'reset', 'howto'], status: ArticleStatus.PUBLISHED, viewCount: 342, helpfulCount: 89 },
      { title: 'Windows Update Failed - Boot Loop Fix', content: '## Symptoms\n- Blue screen after Windows update\n- Error code: 0x800F0922\n- System stuck in restart loop\n\n## Solution\n\n### Method 1: Automatic Repair\n1. Boot from Windows installation media\n2. Select "Repair your computer"\n3. Navigate to Troubleshoot > Advanced options > Startup Repair', summary: 'Fix Windows boot loop caused by failed Windows update.', category: 'Hardware', tags: ['windows', 'update', 'boot-loop', 'bluescreen'], status: ArticleStatus.PUBLISHED, viewCount: 567, helpfulCount: 234 },
      { title: 'Setting Up Multi-Factor Authentication (MFA)', content: '## Overview\nMFA is required for all corporate accounts.\n\n## Setup Steps\n1. Log in to your account portal\n2. Click "Security info"\n3. Click "+ Add sign-in method"\n4. Select "Authenticator app"\n5. Follow the QR code scanning instructions', summary: 'Complete guide for setting up MFA on corporate accounts.', category: 'Security', tags: ['mfa', 'security', 'authentication', '2fa'], status: ArticleStatus.PUBLISHED, viewCount: 1203, helpfulCount: 456 },
      { title: 'New Employee IT Onboarding Checklist', content: '## IT Onboarding Checklist\n\n### Day 1\n- [ ] Laptop provisioned\n- [ ] Corporate email setup\n- [ ] Microsoft 365 license assigned\n- [ ] MFA configured\n- [ ] VPN access granted', summary: 'Complete IT checklist for new employee onboarding.', category: 'Onboarding', tags: ['onboarding', 'new-hire', 'checklist', 'setup'], status: ArticleStatus.PUBLISHED, viewCount: 892, helpfulCount: 312 },
      { title: 'Email Not Sending - Troubleshooting Guide', content: '## Common Causes\n1. Email stuck in Outbox\n2. Attachment too large (>25MB limit)\n3. Outlook profile corruption\n\n## Quick Fix Steps\n1. Check if Outlook is in "Work Offline" mode\n2. Try sending from web (outlook.office.com)\n3. Clear the Outbox manually', summary: 'Troubleshoot email delivery issues in Microsoft Outlook.', category: 'Email & Collaboration', tags: ['email', 'outlook', 'troubleshoot'], status: ArticleStatus.PUBLISHED, viewCount: 445, helpfulCount: 178 },
      { title: 'Database Connection Pool Exhaustion - Resolution Guide', content: '## Symptoms\n- Applications returning "Too many connections" errors\n- Database CPU at 100%\n\n## Immediate Actions\n1. Check active connections\n2. Kill idle connections\n\n## Long-term Fix\nImplement PgBouncer as a connection pooler.', summary: 'Resolve database connection pool exhaustion issues.', category: 'Infrastructure', tags: ['database', 'postgresql', 'performance', 'connections'], status: ArticleStatus.PUBLISHED, aiGenerated: true, viewCount: 234, helpfulCount: 89 },
    ]);
    this.logger.log(`Created ${articles.length} knowledge articles`);

    const cis = await this.ciRepo.save([
      { name: 'PROD-DB-01', ciType: CIType.DATABASE, status: CIStatus.DEGRADED, environment: 'production', hostname: 'prod-db-01.internal', ipAddress: '10.0.1.10', manufacturer: 'Dell', model: 'PowerEdge R750', osType: 'Linux', osVersion: 'RHEL 8.9', businessService: 'Core Platform', department: 'Infrastructure', tags: ['production', 'critical', 'database'] },
      { name: 'PROD-DB-02', ciType: CIType.DATABASE, status: CIStatus.OPERATIONAL, environment: 'production', hostname: 'prod-db-02.internal', ipAddress: '10.0.1.11', manufacturer: 'Dell', model: 'PowerEdge R750', osType: 'Linux', osVersion: 'RHEL 8.9', businessService: 'Core Platform', department: 'Infrastructure', tags: ['production', 'database', 'replica'] },
      { name: 'VPN-GW-01', ciType: CIType.NETWORK_DEVICE, status: CIStatus.DEGRADED, environment: 'production', hostname: 'vpn-gw-01.internal', ipAddress: '203.0.113.10', manufacturer: 'Fortinet', model: 'FortiGate 600E', businessService: 'Remote Access', tags: ['vpn', 'network', 'gateway', 'production'] },
      { name: 'API-GW-01', ciType: CIType.APPLICATION, status: CIStatus.OPERATIONAL, environment: 'production', hostname: 'api-gw.internal', ipAddress: '10.0.2.1', businessService: 'API Platform', department: 'Engineering', tags: ['api', 'gateway', 'production'] },
      { name: 'MAIL-01', ciType: CIType.APPLICATION, status: CIStatus.DEGRADED, environment: 'production', hostname: 'mail-01.internal', ipAddress: '10.0.3.5', businessService: 'Email', department: 'IT', tags: ['email', 'mail', 'production'] },
      { name: 'K8S-PROD-CLUSTER', ciType: CIType.CONTAINER, status: CIStatus.OPERATIONAL, environment: 'production', hostname: 'k8s.internal', businessService: 'Container Platform', department: 'DevOps', tags: ['kubernetes', 'container', 'production'] },
      { name: 'BACKUP-NAS-01', ciType: CIType.STORAGE, status: CIStatus.OPERATIONAL, environment: 'production', hostname: 'backup-nas-01.internal', ipAddress: '10.0.5.1', manufacturer: 'NetApp', model: 'FAS8700', businessService: 'Backup & Recovery', tags: ['storage', 'backup', 'nas'] },
      { name: 'DEV-DB-01', ciType: CIType.DATABASE, status: CIStatus.OPERATIONAL, environment: 'development', hostname: 'dev-db-01.internal', ipAddress: '10.1.1.10', businessService: 'Development', department: 'Engineering', tags: ['development', 'database'] },
      { name: 'MONITORING-01', ciType: CIType.APPLICATION, status: CIStatus.OPERATIONAL, environment: 'production', hostname: 'monitoring.internal', ipAddress: '10.0.4.1', businessService: 'Monitoring', department: 'DevOps', tags: ['monitoring', 'observability'] },
      { name: 'FIREWALL-01', ciType: CIType.NETWORK_DEVICE, status: CIStatus.OPERATIONAL, environment: 'production', hostname: 'fw-01.internal', ipAddress: '192.168.1.1', manufacturer: 'Palo Alto', model: 'PA-5260', businessService: 'Network Security', department: 'Security', tags: ['firewall', 'security', 'network'] },
    ]);
    this.logger.log(`Created ${cis.length} CIs`);

    const workflows = await this.wfRepo.save([
      { name: 'Auto-assign Critical Incidents', description: 'Automatically assign critical incidents to senior agents', status: WorkflowStatus.ACTIVE, trigger: { type: WorkflowTriggerType.TICKET_CREATED }, conditions: [{ field: 'priority', operator: 'equals', value: 'critical' }, { field: 'type', operator: 'equals', value: 'incident' }], actions: [{ type: 'assign_ticket', order: 1, config: { assigneeId: users[1].id } }, { type: 'send_notification', order: 2, config: { message: 'CRITICAL incident requires immediate attention' } }], executionCount: 23, successCount: 22 },
      { name: 'SLA Warning Notification', description: 'Send notification when SLA is at risk (30 min before breach)', status: WorkflowStatus.ACTIVE, trigger: { type: WorkflowTriggerType.SLA_BREACH_IMMINENT }, conditions: [], actions: [{ type: 'send_notification', order: 1, config: { type: 'sla_warning' } }], executionCount: 87, successCount: 87 },
      { name: 'Auto-create Problem from Recurring Incidents', description: 'When 3+ similar incidents are detected, create a problem record', status: WorkflowStatus.ACTIVE, trigger: { type: WorkflowTriggerType.TICKET_CREATED }, conditions: [{ field: 'type', operator: 'equals', value: 'incident' }], actions: [{ type: 'detect_pattern', order: 1, config: { threshold: 3, timeWindowHours: 24 } }, { type: 'create_ticket', order: 2, config: { type: 'problem', copyFields: true } }], executionCount: 12, successCount: 12 },
      { name: 'Slack Alert for High Priority Incidents', description: 'Post to #incidents Slack channel when high/critical incident is created', status: WorkflowStatus.ACTIVE, trigger: { type: WorkflowTriggerType.TICKET_CREATED }, conditions: [{ field: 'priority', operator: 'in', value: ['critical', 'high'] }], actions: [{ type: 'call_webhook', order: 1, config: { target: 'slack', channel: '#incidents' } }], executionCount: 45, successCount: 43 },
      { name: 'Change Approval Reminder', description: 'Send approval reminder 24h before scheduled change', status: WorkflowStatus.INACTIVE, trigger: { type: WorkflowTriggerType.SCHEDULE }, conditions: [], actions: [{ type: 'send_email', order: 1, config: { template: 'change_approval_reminder' } }], executionCount: 5, successCount: 5 },
    ]);
    this.logger.log(`Created ${workflows.length} workflows`);

    const catalog = await this.catalogRepo.save([
      { name: 'New Employee Setup', description: 'Complete IT setup for new employees: laptop, accounts, software, and access provisioning.', category: 'Onboarding', icon: 'UserPlus', slaHours: 24, requiresApproval: true, approvers: [users[0].id], formFields: [{ id: '1', label: 'Employee Name', type: 'text', required: true }, { id: '2', label: 'Start Date', type: 'date', required: true }, { id: '3', label: 'Department', type: 'select', required: true, options: ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR'] }], sortOrder: 1, requestCount: 47 },
      { name: 'Software License Request', description: 'Request new software licenses or additional seats for existing software.', category: 'Software', icon: 'Package', slaHours: 48, requiresApproval: true, approvers: [users[0].id], formFields: [{ id: '1', label: 'Software Name', type: 'text', required: true }, { id: '2', label: 'Number of Licenses', type: 'number', required: true }, { id: '3', label: 'Business Justification', type: 'textarea', required: true }], sortOrder: 2, requestCount: 23 },
      { name: 'Access Request', description: 'Request access to systems, applications, shared drives, or distribution lists.', category: 'Access Management', icon: 'Key', slaHours: 4, requiresApproval: true, approvers: [users[0].id], formFields: [{ id: '1', label: 'System/Application', type: 'text', required: true }, { id: '2', label: 'Access Level', type: 'select', required: true, options: ['Read Only', 'Read/Write', 'Full Access', 'Admin'] }, { id: '3', label: 'Justification', type: 'textarea', required: true }], sortOrder: 3, requestCount: 156 },
      { name: 'VPN Access Setup', description: 'Set up VPN access for remote work.', category: 'Network', icon: 'Shield', slaHours: 2, requiresApproval: false, formFields: [{ id: '1', label: 'Device Type', type: 'select', required: true, options: ['Windows', 'Mac', 'Linux', 'iOS', 'Android'] }], sortOrder: 4, requestCount: 89 },
      { name: 'Password Reset', description: 'Reset your corporate account password. Available 24/7.', category: 'Account Management', icon: 'Lock', slaHours: 1, requiresApproval: false, formFields: [{ id: '1', label: 'Account Email', type: 'text', required: true }], sortOrder: 5, requestCount: 342 },
      { name: 'Hardware Repair/Replacement', description: 'Request repair or replacement for faulty hardware.', category: 'Hardware', icon: 'Wrench', slaHours: 24, requiresApproval: false, formFields: [{ id: '1', label: 'Hardware Type', type: 'select', required: true, options: ['Laptop', 'Monitor', 'Keyboard/Mouse', 'Headset', 'Docking Station', 'Other'] }, { id: '2', label: 'Asset Tag', type: 'text', required: false }, { id: '3', label: 'Issue Description', type: 'textarea', required: true }], sortOrder: 6, requestCount: 67 },
      { name: 'Meeting Room Tech Support', description: 'Get help with conference room AV equipment and video conferencing.', category: 'Facilities', icon: 'Monitor', slaHours: 1, requiresApproval: false, formFields: [{ id: '1', label: 'Room Number', type: 'text', required: true }, { id: '2', label: 'Meeting Time', type: 'date', required: true }], sortOrder: 7, requestCount: 124 },
      { name: 'Cloud Storage Increase', description: 'Request additional OneDrive/SharePoint storage capacity.', category: 'Cloud Services', icon: 'Cloud', slaHours: 8, requiresApproval: true, approvers: [users[0].id], formFields: [{ id: '1', label: 'Current Storage Usage', type: 'text', required: true }, { id: '2', label: 'Requested Storage (GB)', type: 'number', required: true }], sortOrder: 8, requestCount: 34 },
    ]);
    this.logger.log(`Created ${catalog.length} catalog items`);
  }
}
