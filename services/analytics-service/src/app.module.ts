import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { AnalyticsModule } from './analytics/analytics.module';
import { ScanMetric } from './analytics/entities/scan-metric.entity';
import { TemplateCreatedMetric } from './analytics/entities/template-created-metric.entity';
import { TemplateStarredMetric } from './analytics/entities/template-starred-metric.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.ANALYTICS_DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/vibeguard',
      entities: [ScanMetric, TemplateCreatedMetric, TemplateStarredMetric],
      synchronize: false,
    }),
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
