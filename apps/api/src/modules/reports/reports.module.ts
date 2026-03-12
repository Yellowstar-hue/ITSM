import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Ticket } from '../tickets/entities/ticket.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), AiModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
