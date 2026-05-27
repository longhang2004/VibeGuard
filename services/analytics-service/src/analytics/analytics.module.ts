import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ScanMetric } from './entities/scan-metric.entity';
import { TemplateCreatedMetric } from './entities/template-created-metric.entity';
import { TemplateStarredMetric } from './entities/template-starred-metric.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScanMetric,
      TemplateCreatedMetric,
      TemplateStarredMetric,
    ]),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
