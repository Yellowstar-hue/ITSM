import { Controller, Get, Patch, Post, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get() getForUser(@CurrentUser() user: User, @Query('unread') unread?: boolean) {
    return this.notificationsService.getForUser(user.id, unread);
  }
  @Get('unread-count') getUnreadCount(@CurrentUser() user: User) {
    return this.notificationsService.getUnreadCount(user.id).then(count => ({ count }));
  }
  @Patch(':id/read') @HttpCode(HttpStatus.NO_CONTENT) markRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationsService.markRead(id, user.id);
  }
  @Post('mark-all-read') @HttpCode(HttpStatus.NO_CONTENT) markAllRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllRead(user.id);
  }
}
