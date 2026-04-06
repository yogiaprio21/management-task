import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  console.log('[1/7] Starting bootstrap process...');
  const app = await NestFactory.create(AppModule);
  console.log('[2/7] Nest application instance created.');

  // Security
  app.use(helmet());
  app.use(compression());
  console.log('[3/7] Security middleware (Helmet, Compression) applied.');

  /**
   * CORS Configuration
   */
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://management-task-iota.vercel.app',
        'https://management-task1.vercel.app',
        process.env.FRONTEND_URL, // Allow env var override
      ].filter(Boolean);
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  console.log('[4/7] CORS enabled.');

  /**
   * Global Validation Pipe
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  console.log('[5/7] Global validation pipe set.');

  /**
   * Swagger API Documentation (Non-production only)
   */
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Task Management API')
      .setDescription('API documentation for Task Management System (Scrum, Agile)')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    console.log('[6/7] Swagger UI configured at /api.');
  }

  /**
   * Dynamic Port (Render compatible)
   */
  const port = process.env.PORT || 3000;
  
  console.log(`🔧 Environment Config:`);
  console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   - DB_SYNCHRONIZE: ${process.env.DB_SYNCHRONIZE}`);
  console.log(`   - DB_SSL: ${process.env.DB_SSL}`);

  await app.listen(port);
  console.log(`[7/7] 🚀 Backend running on port ${port}`);

  // Run Seed in Production if Needed (Non-blocking)
  if (process.env.NODE_ENV === 'production') {
    try {
      const { runSeed } = await import('./seed');
      console.log('🌱 Triggering Seed process in background...');
      // Pass the existing app instance to reuse connection and ensure sync is complete
      runSeed(app).catch(err => console.error('❌ Seed failed:', err));
    } catch (error) {
      console.error('❌ Failed to load seed script:', error);
    }
  }
}

bootstrap();
