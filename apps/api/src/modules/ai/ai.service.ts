import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TriageResult {
  priority: string;
  category: string;
  sentiment: string;
  sentimentScore: number;
  suggestedGroup: string;
  summary: string;
  urgency: string;
  impact: string;
  tags: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openaiClient: any = null;
  private anthropicClient: any = null;
  private useAI: boolean = false;

  constructor(private configService: ConfigService) {
    this.initClients();
  }

  private initClients() {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (openaiKey && openaiKey !== 'your-openai-key') {
      try {
        const { OpenAI } = require('openai');
        this.openaiClient = new OpenAI({ apiKey: openaiKey });
        this.useAI = true;
        this.logger.log('OpenAI client initialized');
      } catch (e) {
        this.logger.warn('OpenAI initialization failed, using mock AI');
      }
    }

    if (anthropicKey && anthropicKey !== 'your-anthropic-key') {
      try {
        const Anthropic = require('@anthropic-ai/sdk');
        this.anthropicClient = new Anthropic.default({ apiKey: anthropicKey });
        this.useAI = true;
        this.logger.log('Anthropic client initialized');
      } catch (e) {
        this.logger.warn('Anthropic initialization failed');
      }
    }

    if (!this.useAI) {
      this.logger.log('Running with mock AI responses (no API keys configured)');
    }
  }

  async triageTicket(ticket: { title: string; description: string; type: string }): Promise<TriageResult> {
    if (this.useAI && this.openaiClient) {
      return this.triageWithOpenAI(ticket);
    }
    return this.mockTriage(ticket);
  }

  private async triageWithOpenAI(ticket: any): Promise<TriageResult> {
    try {
      const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an ITSM triage AI. Analyze IT tickets and return a JSON object with:
- priority: "critical"|"high"|"medium"|"low"
- category: string (e.g. "Network", "Hardware", "Software", "Security", "Access")
- sentiment: "positive"|"neutral"|"frustrated"|"urgent"
- sentimentScore: number 0-1 (1=most negative/urgent)
- suggestedGroup: string (team to handle it)
- summary: string (1-2 sentence summary)
- urgency: "1-Critical"|"2-High"|"3-Medium"|"4-Low"
- impact: "1-Enterprise"|"2-Site"|"3-Department"|"4-Individual"
- tags: string[] (relevant tags)
Return only valid JSON.`,
          },
          {
            role: 'user',
            content: `Ticket Type: ${ticket.type}\nTitle: ${ticket.title}\nDescription: ${ticket.description}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      this.logger.error('OpenAI triage failed', e.message);
      return this.mockTriage(ticket);
    }
  }

  private mockTriage(ticket: { title: string; description: string; type: string }): TriageResult {
    const titleLower = ticket.title.toLowerCase();
    const descLower = ticket.description.toLowerCase();

    let priority = 'medium';
    let sentiment = 'neutral';
    let sentimentScore = 0.3;
    let category = 'General IT';
    let suggestedGroup = 'IT Support';

    if (titleLower.includes('down') || titleLower.includes('outage') || titleLower.includes('critical') || descLower.includes('production')) {
      priority = 'critical';
      sentiment = 'urgent';
      sentimentScore = 0.9;
    } else if (titleLower.includes('slow') || titleLower.includes('error') || titleLower.includes('fail')) {
      priority = 'high';
      sentiment = 'frustrated';
      sentimentScore = 0.6;
    } else if (titleLower.includes('request') || titleLower.includes('access') || titleLower.includes('install')) {
      priority = 'low';
      sentiment = 'neutral';
      sentimentScore = 0.2;
    }

    if (titleLower.includes('vpn') || titleLower.includes('network') || titleLower.includes('wifi') || titleLower.includes('internet')) {
      category = 'Network';
      suggestedGroup = 'Network Team';
    } else if (titleLower.includes('email') || titleLower.includes('outlook') || titleLower.includes('mail')) {
      category = 'Email & Collaboration';
      suggestedGroup = 'Messaging Team';
    } else if (titleLower.includes('password') || titleLower.includes('access') || titleLower.includes('login') || titleLower.includes('account')) {
      category = 'Access Management';
      suggestedGroup = 'Identity & Access';
    } else if (titleLower.includes('laptop') || titleLower.includes('computer') || titleLower.includes('hardware') || titleLower.includes('printer')) {
      category = 'Hardware';
      suggestedGroup = 'Desktop Support';
    } else if (titleLower.includes('server') || titleLower.includes('database') || titleLower.includes('api')) {
      category = 'Infrastructure';
      suggestedGroup = 'Infrastructure Team';
    } else if (titleLower.includes('security') || titleLower.includes('virus') || titleLower.includes('breach')) {
      category = 'Security';
      suggestedGroup = 'Security Team';
    }

    return {
      priority,
      category,
      sentiment,
      sentimentScore,
      suggestedGroup,
      summary: `${ticket.type.replace('_', ' ')} related to ${category.toLowerCase()}. ${priority === 'critical' ? 'Requires immediate attention.' : 'Standard resolution process applies.'}`,
      urgency: priority === 'critical' ? '1-Critical' : priority === 'high' ? '2-High' : priority === 'medium' ? '3-Medium' : '4-Low',
      impact: priority === 'critical' ? '1-Enterprise' : priority === 'high' ? '2-Site' : '3-Department',
      tags: [category.toLowerCase().replace(/\s+/g, '-'), ticket.type, priority],
    };
  }

  async summarizeTicket(ticket: { title: string; description: string; worklogs?: any[] }): Promise<string> {
    if (this.useAI && this.openaiClient) {
      try {
        const worklogs = ticket.worklogs?.map((w: any) => w.content).join('\n') || '';
        const response = await this.openaiClient.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Summarize this IT ticket in 2-3 concise sentences. Focus on the issue, impact, and current status.' },
            { role: 'user', content: `Title: ${ticket.title}\nDescription: ${ticket.description}\nWork Notes: ${worklogs}` },
          ],
          max_tokens: 200,
        });
        return response.choices[0].message.content;
      } catch (e) {
        return this.mockSummary(ticket.title);
      }
    }
    return this.mockSummary(ticket.title);
  }

  private mockSummary(title: string): string {
    return `Ticket opened for "${title}". Investigation is underway by the support team. Updates will be provided as the situation develops.`;
  }

  async detectSimilarTickets(title: string, description: string, allTickets: any[]): Promise<any[]> {
    // Simple keyword-based similarity without vector DB
    const titleWords = new Set(title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const descWords = new Set(description.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const queryWords = new Set([...titleWords, ...descWords]);

    const scored = allTickets.map(ticket => {
      const ticketWords = new Set(
        `${ticket.title} ${ticket.description}`.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      );
      const intersection = [...queryWords].filter(w => ticketWords.has(w));
      const score = intersection.length / Math.max(queryWords.size, ticketWords.size);
      return { ticket, score };
    });

    return scored
      .filter(s => s.score > 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => ({ ...s.ticket, similarityScore: Math.round(s.score * 100) }));
  }

  async generateKnowledgeArticle(ticket: { title: string; description: string; resolution?: string }): Promise<{ title: string; content: string; summary: string; tags: string[] }> {
    if (this.useAI && this.openaiClient) {
      try {
        const response = await this.openaiClient.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'Generate a professional knowledge base article from this resolved IT ticket. Return JSON with: title, content (markdown), summary (1-2 sentences), tags (array of strings).',
            },
            {
              role: 'user',
              content: `Title: ${ticket.title}\nIssue: ${ticket.description}\nResolution: ${ticket.resolution || 'Not provided'}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        });
        return JSON.parse(response.choices[0].message.content);
      } catch (e) {
        return this.mockKnowledgeArticle(ticket);
      }
    }
    return this.mockKnowledgeArticle(ticket);
  }

  private mockKnowledgeArticle(ticket: any) {
    return {
      title: `How to resolve: ${ticket.title}`,
      content: `## Problem\n\n${ticket.description}\n\n## Solution\n\n${ticket.resolution || 'Follow standard troubleshooting procedures.'}\n\n## Prevention\n\nTo prevent this issue from recurring, ensure regular maintenance and monitoring is in place.`,
      summary: `Resolution guide for ${ticket.title}.`,
      tags: ['troubleshooting', 'how-to', 'resolved'],
    };
  }

  async predictChangeRisk(change: { title: string; description: string; affectedService?: string }): Promise<{ riskScore: number; riskLevel: string; factors: string[] }> {
    const factors: string[] = [];
    let riskScore = 30;

    const titleLower = change.title.toLowerCase();
    const descLower = change.description.toLowerCase();

    if (titleLower.includes('production') || descLower.includes('production')) {
      riskScore += 25;
      factors.push('Affects production environment');
    }
    if (titleLower.includes('database') || descLower.includes('database') || descLower.includes('schema')) {
      riskScore += 20;
      factors.push('Database changes involved');
    }
    if (descLower.includes('rollback') || descLower.includes('backup')) {
      riskScore -= 15;
      factors.push('Rollback plan documented');
    }
    if (titleLower.includes('patch') || titleLower.includes('update') || titleLower.includes('upgrade')) {
      riskScore += 10;
      factors.push('Software update - test coverage important');
    }
    if (descLower.includes('tested') || descLower.includes('staging') || descLower.includes('uat')) {
      riskScore -= 10;
      factors.push('Testing evidence provided');
    }

    riskScore = Math.min(100, Math.max(0, riskScore));
    const riskLevel = riskScore >= 75 ? 'very_high' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

    return { riskScore, riskLevel, factors };
  }

  async detectMajorIncident(tickets: any[]): Promise<{ isMajor: boolean; pattern?: string; affectedCount?: number }> {
    if (tickets.length < 3) return { isMajor: false };

    const categories: Record<string, number> = {};
    tickets.forEach(t => {
      const cat = t.category || 'unknown';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const dominant = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (dominant && dominant[1] >= 3) {
      return {
        isMajor: true,
        pattern: `Multiple ${dominant[0]} incidents detected`,
        affectedCount: dominant[1],
      };
    }
    return { isMajor: false };
  }

  async chatWithAgent(messages: ChatMessage[], context?: string): Promise<string> {
    if (this.useAI && this.openaiClient) {
      try {
        const systemMsg = `You are an intelligent IT Operations Assistant for SimpleNow ITSM.
Help IT administrators with ticket analysis, incident management, and operational insights.
${context ? `Current context: ${context}` : ''}
Be concise, professional, and actionable.`;

        const response = await this.openaiClient.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemMsg },
            ...messages.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 800,
          temperature: 0.7,
        });
        return response.choices[0].message.content;
      } catch (e) {
        return this.mockChatResponse(messages[messages.length - 1]?.content || '');
      }
    }
    return this.mockChatResponse(messages[messages.length - 1]?.content || '');
  }

  private mockChatResponse(userMessage: string): string {
    const lower = userMessage.toLowerCase();
    if (lower.includes('incident') || lower.includes('ticket')) {
      return "I've analyzed your ticket queue. There are currently 3 high-priority incidents requiring immediate attention. The most critical is a network outage affecting the East datacenter. Would you like me to help prioritize the resolution steps?";
    }
    if (lower.includes('sla') || lower.includes('breach')) {
      return "SLA Analysis: 2 tickets are at risk of breaching their SLA in the next 30 minutes (INC-0042 and INC-0038). I recommend escalating these immediately to the Network Team. Shall I generate the escalation notifications?";
    }
    if (lower.includes('report') || lower.includes('trend')) {
      return "Based on the last 7 days of data: Incident volume is up 12% compared to last week. The top category is Network (34%), followed by Access Management (22%). Mean Time to Resolve has improved to 4.2 hours. Would you like a detailed report?";
    }
    return "I'm here to help with IT operations. I can analyze incidents, suggest prioritization, detect patterns, predict SLA breaches, and generate reports. What would you like to explore?";
  }

  async semanticSearch(query: string, items: any[]): Promise<any[]> {
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));

    return items
      .map(item => {
        const text = `${item.title || ''} ${item.description || ''} ${item.content || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
        const words = text.split(/\s+/);
        const matches = [...queryWords].filter(w => text.includes(w)).length;
        const score = matches / queryWords.size;
        return { ...item, searchScore: score };
      })
      .filter(i => i.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore)
      .slice(0, 10);
  }

  async analyzeIncidentPattern(tickets: any[]): Promise<string[]> {
    const insights: string[] = [];

    if (tickets.length === 0) return insights;

    // Category analysis
    const categories: Record<string, number> = {};
    tickets.forEach(t => { if (t.category) categories[t.category] = (categories[t.category] || 0) + 1; });
    const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (topCat && topCat[1] > 2) insights.push(`High volume in ${topCat[0]}: ${topCat[1]} tickets`);

    // SLA analysis
    const breached = tickets.filter(t => t.slaBreachAt && new Date(t.slaBreachAt) < new Date()).length;
    if (breached > 0) insights.push(`${breached} tickets have breached SLA`);

    // Time pattern
    const openTickets = tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length;
    if (openTickets > 10) insights.push(`High open ticket volume: ${openTickets} unresolved`);

    return insights;
  }
}
