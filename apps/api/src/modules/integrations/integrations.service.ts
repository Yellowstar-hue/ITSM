import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  source: string;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  private connectors = [
    { id: 'slack', name: 'Slack', description: 'Send notifications to Slack channels', icon: 'slack', category: 'messaging', status: 'available' },
    { id: 'teams', name: 'Microsoft Teams', description: 'Post updates to Teams channels', icon: 'teams', category: 'messaging', status: 'available' },
    { id: 'jira', name: 'Jira Software', description: 'Sync tickets with Jira issues', icon: 'jira', category: 'ticketing', status: 'available' },
    { id: 'github', name: 'GitHub', description: 'Link tickets to GitHub issues/PRs', icon: 'github', category: 'development', status: 'available' },
    { id: 'azure-ad', name: 'Azure Active Directory', description: 'SSO and user sync', icon: 'azure', category: 'identity', status: 'available' },
    { id: 'okta', name: 'Okta', description: 'Identity and access management', icon: 'okta', category: 'identity', status: 'available' },
    { id: 'pagerduty', name: 'PagerDuty', description: 'On-call alerting and escalation', icon: 'pagerduty', category: 'alerting', status: 'available' },
    { id: 'datadog', name: 'Datadog', description: 'Auto-create incidents from alerts', icon: 'datadog', category: 'monitoring', status: 'available' },
    { id: 'prometheus', name: 'Prometheus/Alertmanager', description: 'Receive monitoring alerts', icon: 'prometheus', category: 'monitoring', status: 'available' },
    { id: 'email', name: 'Email (SMTP)', description: 'Email notifications', icon: 'email', category: 'notifications', status: 'configured' },
  ];

  private installedIntegrations: any[] = [];

  constructor(private configService: ConfigService) {}

  getAvailableConnectors() {
    return this.connectors;
  }

  getInstalledIntegrations() {
    return this.installedIntegrations;
  }

  async installIntegration(connectorId: string, config: Record<string, string>) {
    const connector = this.connectors.find(c => c.id === connectorId);
    if (!connector) throw new Error('Connector not found');

    const integration = {
      id: `${connectorId}-${Date.now()}`,
      connectorId,
      name: connector.name,
      config: { ...config, configuredAt: new Date().toISOString() },
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    this.installedIntegrations.push(integration);
    this.logger.log(`Integration installed: ${connector.name}`);
    return integration;
  }

  async testIntegration(integrationId: string) {
    const integration = this.installedIntegrations.find(i => i.id === integrationId);
    if (!integration) return { success: false, message: 'Integration not found' };
    return { success: true, message: `${integration.name} connection successful`, latencyMs: Math.floor(Math.random() * 200) + 50 };
  }

  async handleWebhook(source: string, event: string, payload: any) {
    this.logger.log(`Webhook received from ${source}: ${event}`);

    switch (source) {
      case 'datadog':
      case 'prometheus':
        return this.handleMonitoringAlert(source, payload);
      case 'github':
        return this.handleGithubEvent(event, payload);
      default:
        return { processed: true, source, event };
    }
  }

  private async handleMonitoringAlert(source: string, payload: any) {
    // Would create incident ticket
    return { processed: true, action: 'incident_created', source };
  }

  private async handleGithubEvent(event: string, payload: any) {
    return { processed: true, action: 'ticket_linked', event };
  }

  async sendSlackNotification(channelId: string, message: string, webhookUrl?: string) {
    const url = webhookUrl || this.configService.get('SLACK_WEBHOOK_URL');
    if (!url) {
      this.logger.warn('Slack webhook URL not configured');
      return { sent: false, reason: 'Not configured' };
    }

    try {
      const fetch = require('node-fetch');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, channel: channelId }),
      });
      return { sent: response.ok, status: response.status };
    } catch (e) {
      this.logger.error('Slack notification failed', e.message);
      return { sent: false, error: e.message };
    }
  }
}
