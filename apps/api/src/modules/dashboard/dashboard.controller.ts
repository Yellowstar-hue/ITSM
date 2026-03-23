import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics') @ApiOperation({ summary: 'Get dashboard metrics' }) getMetrics() { return this.dashboardService.getMetrics(); }
  @Get('trends') @ApiOperation({ summary: 'Get incident trend' }) getTrend(@Query('days') days?: number) { return this.dashboardService.getIncidentTrend(days); }
  @Get('priority-distribution') getPriorityDistribution() { return this.dashboardService.getPriorityDistribution(); }
  @Get('category-distribution') getCategoryDistribution() { return this.dashboardService.getCategoryDistribution(); }
  @Get('recent-tickets') getRecentTickets(@Query('limit') limit?: number) { return this.dashboardService.getRecentTickets(limit); }
  @Get('ai-insights') getAiInsights() { return this.dashboardService.getAiInsights(); }
  @Get('sla-status') getSlaStatus() { return this.dashboardService.getSlaStatus(); }
}
