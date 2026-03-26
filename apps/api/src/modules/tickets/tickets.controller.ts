import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { TicketType, TicketStatus, TicketPriority } from './entities/ticket.entity';

@ApiTags('tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket (incident, request, problem, change)' })
  create(@Body() createTicketDto: CreateTicketDto, @CurrentUser() user: User) {
    return this.ticketsService.create(createTicketDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tickets with filters and pagination' })
  @ApiQuery({ name: 'type', required: false, enum: TicketType })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TicketPriority })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'assigneeId', required: false })
  findAll(
    @Query('type') type?: TicketType,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.ticketsService.findAll({ type, status, priority, assigneeId, search, page, limit, sortBy, sortOrder });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ticket statistics' })
  getStats() {
    return this.ticketsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ticket by ID' })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar tickets using AI' })
  getSimilar(@Param('id') id: string) {
    return this.ticketsService.getSimilarTickets(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ticket' })
  update(@Param('id') id: string, @Body() updateDto: UpdateTicketDto, @CurrentUser() user: User) {
    return this.ticketsService.update(id, updateDto, user.id);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign ticket to a user' })
  assign(@Param('id') id: string, @Body('assigneeId') assigneeId: string, @CurrentUser() user: User) {
    return this.ticketsService.assign(id, assigneeId, user.id);
  }

  @Post(':id/worklogs')
  @ApiOperation({ summary: 'Add a worklog entry' })
  addWorklog(
    @Param('id') id: string,
    @Body() body: { content: string; timeSpentMinutes?: number; isPublic?: boolean },
    @CurrentUser() user: User,
  ) {
    return this.ticketsService.addWorklog(
      id, body.content, body.timeSpentMinutes || 0,
      user.id, `${user.firstName} ${user.lastName}`, body.isPublic ?? true,
    );
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment' })
  addComment(
    @Param('id') id: string,
    @Body() body: { content: string; isInternal?: boolean },
    @CurrentUser() user: User,
  ) {
    return this.ticketsService.addComment(
      id, body.content, user.id, `${user.firstName} ${user.lastName}`, body.isInternal || false,
    );
  }

  @Post(':id/ai-triage')
  @ApiOperation({ summary: 'Run AI triage on ticket' })
  runAiTriage(@Param('id') id: string) {
    return this.ticketsService.runAiTriage(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a ticket' })
  delete(@Param('id') id: string) {
    return this.ticketsService.delete(id);
  }

  @Post('bulk/update')
  @ApiOperation({ summary: 'Bulk update tickets' })
  bulkUpdate(@Body() body: { ids: string[]; updates: any }, @CurrentUser() user: User) {
    return this.ticketsService.bulkUpdate(body.ids, body.updates, user.id);
  }

  // ── Public guest endpoints (no auth required) ─────────────────────────────

  @Public()
  @Post('guest/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI-analyse a guest ticket description (no ticket created)' })
  analyzeGuest(@Body() body: { title: string; description: string }) {
    return this.ticketsService.analyzeGuest(body.title, body.description);
  }

  @Public()
  @Post('guest')
  @ApiOperation({ summary: 'Create a ticket on behalf of an unauthenticated employee' })
  createGuest(
    @Body() body: { reporterName: string; reporterEmail: string; title: string; description: string },
  ) {
    return this.ticketsService.createGuest(body);
  }
}
