import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Ticket } from '../tickets/entities/ticket.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), AiModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
