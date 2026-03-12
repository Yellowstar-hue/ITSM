import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CmdbService } from './cmdb.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CIType, CIStatus } from './entities/ci.entity';

@ApiTags('cmdb')
@Controller('cmdb')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CmdbController {
  constructor(private readonly cmdbService: CmdbService) {}

  @Get() findAll(@Query('ciType') ciType?: CIType, @Query('status') status?: CIStatus, @Query('search') search?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.cmdbService.findAll({ ciType, status, search, page, limit });
  }

  @Get('stats') getStats() { return this.cmdbService.getStats(); }

  @Get(':id') findOne(@Param('id') id: string) { return this.cmdbService.findOne(id); }

  @Get(':id/relationships') getRelationships(@Param('id') id: string) { return this.cmdbService.getRelationshipMap(id); }

  @Post() create(@Body() body: any) { return this.cmdbService.create(body); }

  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.cmdbService.update(id, body); }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) delete(@Param('id') id: string) { return this.cmdbService.delete(id); }
}
