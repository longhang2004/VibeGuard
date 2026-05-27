import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const kafkaBrokers = process.env.NOTIFICATION_KAFKA_BROKERS || 'localhost:9092';

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: kafkaBrokers.split(','),
      },
      consumer: {
        groupId: 'notification-service-group',
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.NOTIFICATION_PORT || 3003;
  await app.listen(port);
  console.log(`notification-service is running on: http://localhost:${port}`);
  console.log(`notification-service connected to Kafka at: ${kafkaBrokers}`);
}
bootstrap();
