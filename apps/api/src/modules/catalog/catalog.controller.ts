import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('catalog')
@Controller('catalog')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get() findAll(@Query('category') category?: string) { return this.catalogService.findAll({ category }); }
  @Get('categories') getCategories() { return this.catalogService.getCategories(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.catalogService.findOne(id); }
  @Post() create(@Body() body: any) { return this.catalogService.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.catalogService.update(id, body); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) delete(@Param('id') id: string) { return this.catalogService.delete(id); }
}
