import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService, ChatMessage } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('triage')
  @ApiOperation({ summary: 'AI triage for a ticket' })
  triage(@Body() body: { title: string; description: string; type: string }) {
    return this.aiService.triageTicket(body);
  }

  @Post('summarize')
  @ApiOperation({ summary: 'AI summarize a ticket' })
  summarize(@Body() body: { title: string; description: string; worklogs?: any[] }) {
    return this.aiService.summarizeTicket(body);
  }

  @Post('generate-article')
  @ApiOperation({ summary: 'Generate knowledge article from resolved ticket' })
  generateArticle(@Body() body: { title: string; description: string; resolution?: string }) {
    return this.aiService.generateKnowledgeArticle(body);
  }

  @Post('change-risk')
  @ApiOperation({ summary: 'Predict change risk score' })
  predictChangeRisk(@Body() body: { title: string; description: string; affectedService?: string }) {
    return this.aiService.predictChangeRisk(body);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI Operations Assistant' })
  chat(@Body() body: { messages: ChatMessage[]; context?: string }) {
    return this.aiService.chatWithAgent(body.messages, body.context).then(response => ({
      role: 'assistant',
      content: response,
    }));
  }

  @Post('search')
  @ApiOperation({ summary: 'Semantic search across items' })
  search(@Body() body: { query: string; items: any[] }) {
    return this.aiService.semanticSearch(body.query, body.items);
  }

  @Post('detect-pattern')
  @ApiOperation({ summary: 'Detect major incident patterns' })
  detectPattern(@Body() body: { tickets: any[] }) {
    return this.aiService.detectMajorIncident(body.tickets);
  }
}
