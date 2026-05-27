import { Controller, Get, Headers, BadRequestException } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Kafka Event Pattern Listeners
  @EventPattern('vibeguard.scanner.completed')
  async handleScanCompleted(@Payload() data: any) {
    try {
      const payload = typeof data === 'string' ? JSON.parse(data) : data;
      const { userId, language, summary, timestamp } = payload;
      if (userId && summary) {
        await this.analyticsService.recordScan(
          userId,
          language || 'unknown',
          summary.score || 0,
          summary.critical || 0,
          summary.high || 0,
          timestamp || new Date().toISOString(),
        );
        console.log(`[Analytics] Logged scan metric for user ${userId}`);
      }
    } catch (e) {
      console.error('[Analytics] Failed to handle scan completed event:', e);
    }
  }

  @EventPattern('vibeguard.context.template_created')
  async handleTemplateCreated(@Payload() data: any) {
    try {
      const payload = typeof data === 'string' ? JSON.parse(data) : data;
      const { authorId, projectType, techStack, timestamp } = payload;
      if (authorId) {
        await this.analyticsService.recordTemplateCreated(
          authorId,
          projectType || 'OTHER',
          techStack || [],
          timestamp || new Date().toISOString(),
        );
        console.log(`[Analytics] Logged template created metric for user ${authorId}`);
      }
    } catch (e) {
      console.error('[Analytics] Failed to handle template created event:', e);
    }
  }

  @EventPattern('vibeguard.context.template_starred')
  async handleTemplateStarred(@Payload() data: any) {
    try {
      const payload = typeof data === 'string' ? JSON.parse(data) : data;
      const { templateId, timestamp } = payload;
      if (templateId) {
        await this.analyticsService.recordTemplateStarred(
          templateId,
          timestamp || new Date().toISOString(),
        );
        console.log(`[Analytics] Logged template starred metric for template ${templateId}`);
      }
    } catch (e) {
      console.error('[Analytics] Failed to handle template starred event:', e);
    }
  }

  // REST API Endpoints
  @Get('scans/summary')
  async getScanSummary(@Headers('x-user-id') userId?: string) {
    if (!userId) {
      throw new BadRequestException('User identification header (X-User-Id) is required');
    }
    const summary = await this.analyticsService.getScanSummary(userId);
    return {
      success: true,
      data: summary,
      error: null,
      meta: {},
    };
  }

  @Get('scans/trend')
  async getScanTrend(@Headers('x-user-id') userId?: string) {
    if (!userId) {
      throw new BadRequestException('User identification header (X-User-Id) is required');
    }
    const trend = await this.analyticsService.getScanTrend(userId);
    return {
      success: true,
      data: trend,
      error: null,
      meta: {},
    };
  }

  @Get('templates/popular')
  async getPopularTemplates() {
    const popular = await this.analyticsService.getPopularTemplates();
    return {
      success: true,
      data: popular,
      error: null,
      meta: {},
    };
  }

  @Get('global/stats')
  async getGlobalStats() {
    const stats = await this.analyticsService.getGlobalStats();
    return {
      success: true,
      data: stats,
      error: null,
      meta: {},
    };
  }
}
