import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('connectors') getAvailable() { return this.integrationsService.getAvailableConnectors(); }
  @Get('installed') getInstalled() { return this.integrationsService.getInstalledIntegrations(); }
  @Post('install') install(@Body() body: { connectorId: string; config: Record<string, string> }) {
    return this.integrationsService.installIntegration(body.connectorId, body.config);
  }
  @Post(':id/test') testIntegration(@Param('id') id: string) { return this.integrationsService.testIntegration(id); }

  @Public()
  @Post('webhook/:source')
  @ApiOperation({ summary: 'Receive webhooks from external systems' })
  handleWebhook(@Param('source') source: string, @Body() body: any) {
    return this.integrationsService.handleWebhook(source, body.event || 'unknown', body);
  }
}
