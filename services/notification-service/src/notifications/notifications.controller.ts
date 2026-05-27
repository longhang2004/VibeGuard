import { Controller, Get, Patch, Param, Headers, BadRequestException } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Kafka Event Pattern Listeners
  @EventPattern('vibeguard.scanner.completed')
  async handleScanCompleted(@Payload() data: any) {
    try {
      const payload = typeof data === 'string' ? JSON.parse(data) : data;
      const { scanId, userId, summary } = payload;
      if (!userId || !summary) return;

      const { critical, score } = summary;

      if (critical > 0) {
        const title = 'Critical Security Vulnerability Detected';
        const message = `Scan ${scanId} detected ${critical} critical vulnerabilities with a safety score of ${score}/100.`;
        
        // Save in-app notification
        await this.notificationsService.createNotification(userId, 'ALERT', title, message);
        
        // Post to Slack
        await this.notificationsService.sendSlackNotification(title, message);
      } else if (score < 50) {
        const title = 'Low Security Score Warning';
        const message = `Scan ${scanId} generated a low security score of ${score}/100. Please review the findings.`;
        
        // Save in-app notification
        await this.notificationsService.createNotification(userId, 'WARNING', title, message);
      }
    } catch (e) {
      console.error('[Notification] Failed to process scan completed event:', e);
    }
  }

  @EventPattern('vibeguard.context.template_starred')
  async handleTemplateStarred(@Payload() data: any) {
    try {
      const payload = typeof data === 'string' ? JSON.parse(data) : data;
      const { templateId, userId, authorId } = payload;
      
      // Notify the author if another user starred their template
      if (authorId && userId && authorId !== userId) {
        const title = 'Your Template Was Starred!';
        const message = `A user starred your template (${templateId}).`;
        
        await this.notificationsService.createNotification(authorId, 'INFO', title, message);
      }
    } catch (e) {
      console.error('[Notification] Failed to process template starred event:', e);
    }
  }

  // REST API Endpoints
  @Get()
  async getUnreadNotifications(@Headers('x-user-id') userId?: string) {
    if (!userId) {
      throw new BadRequestException('User identification header (X-User-Id) is required');
    }
    const notifications = await this.notificationsService.getUnreadNotifications(userId);
    return {
      success: true,
      data: notifications,
      error: null,
      meta: {},
    };
  }

  @Patch('read-all')
  async markAllAsRead(@Headers('x-user-id') userId?: string) {
    if (!userId) {
      throw new BadRequestException('User identification header (X-User-Id) is required');
    }
    const result = await this.notificationsService.markAllAsRead(userId);
    return {
      success: true,
      data: result,
      error: null,
      meta: {},
    };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User identification header (X-User-Id) is required');
    }
    const notification = await this.notificationsService.markAsRead(id, userId);
    return {
      success: true,
      data: notification,
      error: null,
      meta: {},
    };
  }
}
