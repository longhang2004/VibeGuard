import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import axios from 'axios';
import { randomUUID } from 'crypto';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async onModuleInit() {
    // Create notifications table if not exists
    await this.entityManager.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create index
    await this.entityManager.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, read);
    `);
  }

  async createNotification(userId: string, type: string, title: string, message: string) {
    const notification = this.notificationRepository.create({
      id: randomUUID(),
      userId,
      type,
      title,
      message,
      read: false,
    });
    return this.notificationRepository.save(notification);
  }

  async sendSlackNotification(title: string, message: string) {
    try {
      const webhookUrl = process.env.NOTIFICATION_SLACK_WEBHOOK_URL;
      if (webhookUrl && webhookUrl.startsWith('http')) {
        await axios.post(webhookUrl, {
          text: `*VibeGuard Alert*\n*${title}*\n${message}`,
        });
        console.log('[Notification] Slack alert successfully dispatched');
      } else {
        console.log('[Notification] Slack webhook URL not configured or invalid, skipping Slack post');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Notification] Failed to send Slack alert:', message);
    }
  }

  async getUnreadNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { userId, read: false },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update({ userId, read: false }, { read: true });
    return { success: true, message: 'All notifications marked as read' };
  }
}
