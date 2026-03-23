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

  /** Zero-dependency liveness check — used by start.sh wait loop */
  @Public()
  @Get('ping')
  ping() {
    return { ok: true, ts: Date.now() };
  }

  @Public()
  @Get()
  async check() {
    let userCount = 0;
    let dbStatus = 'ok';
    let dbError = '';
    try {
      userCount = await this.userRepo.count();
    } catch (e) {
      dbStatus = 'error';
      dbError = e?.message ?? String(e);
    }
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SimpleNow ITSM API',
      version: '1.0.3',
      db: dbStatus,
      dbError: dbError || undefined,
      users: userCount,
    };
  }
}
