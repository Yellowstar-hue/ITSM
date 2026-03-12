import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sla')
  getSlaReport(@Query('start') start?: string, @Query('end') end?: string) {
    const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = end ? new Date(end) : new Date();
    return this.reportsService.getSlaReport(startDate, endDate);
  }

  @Get('incidents/trend')
  getIncidentTrend(@Query('period') period?: 'week' | 'month' | 'quarter') {
    return this.reportsService.getIncidentTrend(period);
  }

  @Get('agents/productivity')
  getAgentProductivity(@Query('start') start?: string, @Query('end') end?: string) {
    const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = end ? new Date(end) : new Date();
    return this.reportsService.getAgentProductivity(startDate, endDate);
  }

  @Get('categories')
  getCategoryReport(@Query('start') start?: string, @Query('end') end?: string) {
    const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = end ? new Date(end) : new Date();
    return this.reportsService.getCategoryReport(startDate, endDate);
  }

  @Post('ai-summary')
  generateAiReport(@Body() body: { reportType: string; data: any }) {
    return this.reportsService.generateAiReport(body.reportType, body.data).then(content => ({ content }));
  }
}
