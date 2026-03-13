import { Module } from '@nestjs/common';
import { HealthController } from './common/health.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './modules/auth/auth.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { CmdbModule } from './modules/cmdb/cmdb.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { AiModule } from './modules/ai/ai.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        let dbUrl = configService.get<string>(
          'DATABASE_URL',
          'postgresql://simplenow:simplenow@localhost:5432/simplenow',
        );
        // Strip channel_binding — pg npm driver doesn't support it (Neon-specific param)
        dbUrl = dbUrl.replace(/([&?])channel_binding=[^&]*/g, '$1').replace(/[?&]$/, '');
        // Detect remote DB (not localhost) to enforce SSL
        const isRemote = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');
        return {
          type: 'postgres' as const,
          url: dbUrl,
          autoLoadEntities: true,
          synchronize: true,
          logging: false,
          ssl: isRemote ? { rejectUnauthorized: false } : false,
          retryAttempts: 15,
          retryDelay: 5000,
          connectTimeoutMS: 30000,
        };
      },
      inject: [ConfigService],
    }),

    // Throttling
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Event emitter
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
    }),

    // Cache
    CacheModule.register({
      isGlobal: true,
      ttl: 300,
    }),

    // Feature modules
    AuthModule,
    TicketsModule,
    KnowledgeModule,
    CmdbModule,
    WorkflowsModule,
    AiModule,
    DashboardModule,
    NotificationsModule,
    CatalogModule,
    IntegrationsModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
