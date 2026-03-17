import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const extraOrigins = (configService.get<string>('CORS_ORIGINS', '') || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  // Security
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
  }));

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [frontendUrl, 'http://localhost:3000', 'http://localhost:3001', ...extraOrigins];
      if (!origin || allowed.includes(origin) || origin.endsWith('.railway.app')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SimpleNow ITSM API')
    .setDescription('Complete ITSM platform API with AI-powered features')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication & authorization')
    .addTag('tickets', 'Ticket management (Incidents, Service Requests, Problems, Changes)')
    .addTag('knowledge', 'Knowledge base management')
    .addTag('cmdb', 'Configuration Management Database')
    .addTag('workflows', 'Workflow automation engine')
    .addTag('ai', 'AI-powered features')
    .addTag('dashboard', 'Real-time metrics and analytics')
    .addTag('notifications', 'Notification management')
    .addTag('catalog', 'Service catalog')
    .addTag('integrations', 'Third-party integrations')
    .addTag('reports', 'Reporting and analytics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  logger.log(`Environment: ${nodeEnv}`);
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
