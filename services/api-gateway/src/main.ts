import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  const port = process.env.GATEWAY_PORT || 3000;
  await app.listen(port);
  console.log(`api-gateway is running on: http://localhost:${port}`);
}
bootstrap();
