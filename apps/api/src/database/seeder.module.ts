import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { User } from '../modules/auth/entities/user.entity';
import { Ticket } from '../modules/tickets/entities/ticket.entity';
import { Article } from '../modules/knowledge/entities/article.entity';
import { ConfigurationItem } from '../modules/cmdb/entities/ci.entity';
import { Workflow } from '../modules/workflows/entities/workflow.entity';
import { CatalogItem } from '../modules/catalog/entities/catalog-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Ticket, Article, ConfigurationItem, Workflow, CatalogItem]),
  ],
  providers: [SeederService],
})
export class SeederModule {}
