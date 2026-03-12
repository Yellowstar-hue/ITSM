import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkflowStatus } from './entities/workflow.entity';

@ApiTags('workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get() findAll(@Query('status') status?: WorkflowStatus, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.workflowsService.findAll({ status, page, limit });
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.workflowsService.findOne(id); }
  @Post() create(@Body() body: any) { return this.workflowsService.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.workflowsService.update(id, body); }
  @Post(':id/activate') activate(@Param('id') id: string) { return this.workflowsService.activate(id); }
  @Post(':id/deactivate') deactivate(@Param('id') id: string) { return this.workflowsService.deactivate(id); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) delete(@Param('id') id: string) { return this.workflowsService.delete(id); }
}
