import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/auth/entities/user.entity';
import { Public } from './decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  @Public()
  @Get()
  async check() {
    let userCount = 0;
    let dbStatus = 'ok';
    try {
      userCount = await this.userRepo.count();
    } catch (e) {
      dbStatus = 'error: ' + e.message;
    }
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SimpleNow ITSM API',
      version: '1.0.2',
      db: dbStatus,
      users: userCount,
    };
  }
}
