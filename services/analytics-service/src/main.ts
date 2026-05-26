import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.ANALYTICS_PORT || 3002;
  await app.listen(port);
  console.log(`analytics-service is running on: http://localhost:${port}`);
}
bootstrap();
