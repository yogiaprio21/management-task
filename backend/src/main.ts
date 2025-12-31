import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * CORS Configuration
   * Sesuaikan dengan domain frontend Vercel
   */
  app.enableCors({
    origin: [
      'http://localhost:5173', // dev
      'http://localhost:3000',
      'https://management-task.vercel.app', // production frontend
    ],
    credentials: true,
  });

  /**
   * Global Validation
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  /**
   * Swagger (Enable only in non-production)
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
  }

  /**
   * Dynamic Port (Render compatible)
   */
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend running on port ${port}`);
}
bootstrap();
