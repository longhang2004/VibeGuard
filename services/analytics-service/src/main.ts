import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const kafkaBrokers = process.env.ANALYTICS_KAFKA_BROKERS || 'localhost:9092';

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: kafkaBrokers.split(','),
      },
      consumer: {
        groupId: 'analytics-service-group',
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.ANALYTICS_PORT || 3002;
  await app.listen(port);
  console.log(`analytics-service is running on: http://localhost:${port}`);
  console.log(`analytics-service connected to Kafka at: ${kafkaBrokers}`);
}
bootstrap();
