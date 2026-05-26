import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Apply Global Validation Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Apply Global Exception Filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Setup Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('VibeGuard API Gateway')
    .setDescription('The core API gateway handling authentication, rate-limiting, and request forwarding.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.GATEWAY_PORT || 3000;
  await app.listen(port);
  console.log(`api-gateway is running on: http://localhost:${port}`);
  console.log(`Swagger documentation is available at: http://localhost:${port}/docs`);
}
bootstrap();
