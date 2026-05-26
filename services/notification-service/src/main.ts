import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.NOTIFICATION_PORT || 3003;
  await app.listen(port);
  console.log(`notification-service is running on: http://localhost:${port}`);
}
bootstrap();
