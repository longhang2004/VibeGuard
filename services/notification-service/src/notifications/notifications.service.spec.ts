import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import axios from 'axios';

jest.mock('axios');

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: Repository<Notification>;
  let entityManager: EntityManager;

  const mockEntityManager = {
    query: jest.fn(),
  };

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    entityManager = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create and save an in-app notification', async () => {
      const mockNotif = { id: 'uuid-1', userId: 'user-1', type: 'ALERT', read: false };
      mockNotificationRepository.create.mockReturnValue(mockNotif);
      mockNotificationRepository.save.mockResolvedValue(mockNotif);

      const result = await service.createNotification('user-1', 'ALERT', 'Alert Title', 'Alert msg');

      expect(result).toEqual(mockNotif);
      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: 'ALERT',
          title: 'Alert Title',
          message: 'Alert msg',
          read: false,
        }),
      );
      expect(notificationRepository.save).toHaveBeenCalledWith(mockNotif);
    });
  });

  describe('getUnreadNotifications', () => {
    it('should query unread notifications ordered by date', async () => {
      const mockList = [{ id: '1', read: false }];
      mockNotificationRepository.find.mockResolvedValue(mockList);

      const result = await service.getUnreadNotifications('user-1');

      expect(result).toEqual(mockList);
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read and save it', async () => {
      const mockNotif = { id: 'uuid-1', userId: 'user-1', read: false };
      mockNotificationRepository.findOne.mockResolvedValue(mockNotif);
      mockNotificationRepository.save.mockImplementation(async (x) => x);

      const result = await service.markAsRead('uuid-1', 'user-1');

      expect(result.read).toBe(true);
      expect(notificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1', userId: 'user-1' },
      });
      expect(notificationRepository.save).toHaveBeenCalledWith(mockNotif);
    });

    it('should throw NotFoundException if not found', async () => {
      mockNotificationRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should update all user notifications to read = true', async () => {
      mockNotificationRepository.update.mockResolvedValue({ affected: 5 });

      const result = await service.markAllAsRead('user-1');

      expect(result.success).toBe(true);
      expect(notificationRepository.update).toHaveBeenCalledWith(
        { userId: 'user-1', read: false },
        { read: true },
      );
    });
  });

  describe('sendSlackNotification', () => {
    it('should skip Slack post if webhook url is missing', async () => {
      delete process.env.NOTIFICATION_SLACK_WEBHOOK_URL;
      
      await service.sendSlackNotification('Test', 'Msg');

      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should call axios post if webhook url exists', async () => {
      process.env.NOTIFICATION_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/test';
      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

      await service.sendSlackNotification('Test Alert', 'Msg body');

      expect(axios.post).toHaveBeenCalledWith('https://hooks.slack.com/services/test', {
        text: expect.stringContaining('Test Alert'),
      });
    });

    it('should catch error and log it without throwing', async () => {
      process.env.NOTIFICATION_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/test';
      (axios.post as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const spyConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      await service.sendSlackNotification('Test', 'Msg');

      expect(spyConsoleError).toHaveBeenCalled();
      spyConsoleError.mockRestore();
    });
  });
});
