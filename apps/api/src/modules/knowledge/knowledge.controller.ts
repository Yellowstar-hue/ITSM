import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ArticleStatus } from './entities/article.entity';

@ApiTags('knowledge')
@Controller('knowledge')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('status') status?: ArticleStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.knowledgeService.findAll({ category, status, search, page, limit });
  }

  @Get('categories')
  getCategories() {
    return this.knowledgeService.getCategories();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.knowledgeService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.knowledgeService.findOne(id);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: User) {
    return this.knowledgeService.create({ ...body, authorId: user.id, authorName: `${user.firstName} ${user.lastName}` });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.knowledgeService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.knowledgeService.delete(id);
  }

  @Post('generate-from-ticket')
  generateFromTicket(@Body() body: any, @CurrentUser() user: User) {
    return this.knowledgeService.generateFromTicket({ ...body, authorId: user.id, authorName: `${user.firstName} ${user.lastName}` });
  }

  @Post(':id/helpful')
  markHelpful(@Param('id') id: string, @Body('helpful') helpful: boolean) {
    return this.knowledgeService.markHelpful(id, helpful);
  }
}
