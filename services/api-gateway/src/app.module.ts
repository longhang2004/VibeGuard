import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { ProxyMiddleware } from './proxy/proxy.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.GATEWAY_DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/vibeguard',
      entities: [User],
      synchronize: true, // Automigrates schema in local dev environment
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 100,
        },
      ],
      storage: new ThrottlerStorageRedisService(
        new Redis({
          host: process.env.GATEWAY_REDIS_HOST || 'localhost',
          port: parseInt(process.env.GATEWAY_REDIS_PORT || '6379', 10),
        })
      ),
    }),
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes('*')
      .apply(ProxyMiddleware)
      .forRoutes('api/*');
  }
}
