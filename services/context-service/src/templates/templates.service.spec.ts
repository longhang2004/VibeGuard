import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import Redis from 'ioredis';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { Template, ProjectType } from './entities/template.entity';
import { TemplateVersion } from './entities/template-version.entity';
import { TemplateStar } from './entities/template-star.entity';
import { REDIS_CLIENT } from '../common/providers/redis.provider';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let templateRepository: Repository<Template>;
  let versionRepository: Repository<TemplateVersion>;
  let starRepository: Repository<TemplateStar>;
  let kafkaClient: ClientKafka;
  let redis: Redis;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockKafkaClient = {
    connect: jest.fn().mockResolvedValue(null),
    emit: jest.fn(),
  };

  const mockUpdateQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  const mockTemplateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findBy: jest.fn(),
    softRemove: jest.fn(),
    increment: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn().mockImplementation((alias?: string) => {
      // When called without alias (for update operations), return update query builder
      if (!alias) return mockUpdateQueryBuilder;
      return mockQueryBuilder;
    }),
  };

  const mockVersionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockStarRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: getRepositoryToken(Template),
          useValue: mockTemplateRepository,
        },
        {
          provide: getRepositoryToken(TemplateVersion),
          useValue: mockVersionRepository,
        },
        {
          provide: getRepositoryToken(TemplateStar),
          useValue: mockStarRepository,
        },
        {
          provide: 'KAFKA_SERVICE',
          useValue: mockKafkaClient,
        },
        {
          provide: REDIS_CLIENT,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    templateRepository = module.get<Repository<Template>>(getRepositoryToken(Template));
    versionRepository = module.get<Repository<TemplateVersion>>(getRepositoryToken(TemplateVersion));
    starRepository = module.get<Repository<TemplateStar>>(getRepositoryToken(TemplateStar));
    kafkaClient = module.get<ClientKafka>('KAFKA_SERVICE');
    redis = module.get<Redis>(REDIS_CLIENT);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should successfully connect to Kafka client', async () => {
      await service.onModuleInit();
      expect(kafkaClient.connect).toHaveBeenCalled();
    });

    it('should handle Kafka connection failure gracefully', async () => {
      mockKafkaClient.connect.mockRejectedValueOnce(new Error('Connection timeout'));
      const spyConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      await service.onModuleInit();
      expect(spyConsoleError).toHaveBeenCalled();
      spyConsoleError.mockRestore();
    });
  });

  describe('create', () => {
    it('should create a template, version 1.0.0, emit Kafka event, and clear trending cache', async () => {
      const createDto = {
        name: 'React Base',
        description: 'React client boilerplate',
        techStack: ['React', 'Vite'],
        projectType: ProjectType.NEXTJS_FRONTEND,
        content: '# React app guidelines',
        isPublic: true,
      };
      const mockSavedTemplate = { id: 'template-uuid', ...createDto, authorId: 'user-uuid', starCount: 0 };
      const mockVersion = { id: 'version-uuid', templateId: 'template-uuid', version: '1.0.0', content: createDto.content, changelog: 'Initial creation' };

      mockTemplateRepository.create.mockReturnValue(mockSavedTemplate);
      mockTemplateRepository.save.mockResolvedValue(mockSavedTemplate);
      mockVersionRepository.create.mockReturnValue(mockVersion);
      mockVersionRepository.save.mockResolvedValue(mockVersion);

      const result = await service.create(createDto, 'user-uuid');

      expect(result).toEqual({ ...mockSavedTemplate, isOwner: true });
      expect(templateRepository.create).toHaveBeenCalledWith({ ...createDto, authorId: 'user-uuid', starCount: 0 });
      expect(templateRepository.save).toHaveBeenCalledWith(mockSavedTemplate);
      expect(versionRepository.create).toHaveBeenCalledWith({
        templateId: 'template-uuid',
        version: '1.0.0',
        content: createDto.content,
        changelog: 'Initial creation',
      });
      expect(versionRepository.save).toHaveBeenCalled();
      expect(kafkaClient.emit).toHaveBeenCalledWith('vibeguard.context.template_created', expect.any(Object));
      expect(redis.del).toHaveBeenCalledWith('trending');
    });
  });

  describe('findOne', () => {
    it('should load template from cache if present', async () => {
      const cachedTemplate = { id: 'template-uuid', name: 'Cached Temp', authorId: 'user-uuid' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedTemplate));

      const result = await service.findOne('template-uuid', 'user-uuid');

      expect(result).toEqual({ id: 'template-uuid', name: 'Cached Temp', isOwner: true });
      expect(redis.get).toHaveBeenCalledWith('template:template-uuid');
      expect(templateRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database if cache misses and set in cache', async () => {
      const dbTemplate = { id: 'template-uuid', name: 'DB Temp', authorId: 'user-uuid' };
      mockRedis.get.mockResolvedValue(null);
      mockTemplateRepository.findOne.mockResolvedValue(dbTemplate);

      const result = await service.findOne('template-uuid', 'different-user-uuid');

      expect(result).toEqual({ id: 'template-uuid', name: 'DB Temp', isOwner: false });
      expect(templateRepository.findOne).toHaveBeenCalledWith({ where: { id: 'template-uuid' } });
      expect(redis.set).toHaveBeenCalledWith('template:template-uuid', JSON.stringify(dbTemplate), 'EX', 300);
    });

    it('should throw NotFoundException if template does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockTemplateRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update template, bump patch version, and clear caches', async () => {
      const template = { id: 'template-uuid', name: 'Old Name', content: 'Old content', authorId: 'user-uuid' };
      const updateDto = { name: 'New Name', content: 'New content', changelog: 'Fix spelling' };
      const latestVersion = { templateId: 'template-uuid', version: '1.0.0', content: 'Old content' };

      mockTemplateRepository.findOne.mockResolvedValue(template);
      mockVersionRepository.findOne.mockResolvedValue(latestVersion);
      mockTemplateRepository.save.mockImplementation(async (t) => t);
      mockVersionRepository.create.mockReturnValue({ version: '1.0.1' });

      const result = await service.update('template-uuid', updateDto, 'user-uuid');

      expect(result.name).toBe('New Name');
      expect(result.content).toBe('New content');
      expect(versionRepository.create).toHaveBeenCalledWith({
        templateId: 'template-uuid',
        version: '1.0.1',
        content: 'New content',
        changelog: 'Fix spelling',
      });
      expect(redis.del).toHaveBeenCalledWith('template:template-uuid');
      expect(redis.del).toHaveBeenCalledWith('trending');
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const template = { id: 'template-uuid', authorId: 'owner-uuid' };
      mockTemplateRepository.findOne.mockResolvedValue(template);

      await expect(
        service.update('template-uuid', { changelog: 'Unauthorized' }, 'attacker-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft delete template and invalidate cache', async () => {
      const template = { id: 'template-uuid', authorId: 'user-uuid' };
      mockTemplateRepository.findOne.mockResolvedValue(template);

      const result = await service.remove('template-uuid', 'user-uuid');

      expect(result.message).toContain('successfully deleted');
      expect(templateRepository.softRemove).toHaveBeenCalledWith(template);
      expect(redis.del).toHaveBeenCalledWith('template:template-uuid');
      expect(redis.del).toHaveBeenCalledWith('trending');
    });
  });

  describe('star/unstar', () => {
    it('should star a template, increase starCount, and publish event', async () => {
      const template = { id: 'template-uuid', authorId: 'author-uuid', starCount: 5 };
      mockTemplateRepository.findOne.mockResolvedValue(template);
      mockStarRepository.findOne.mockResolvedValue(null);

      const result = await service.star('template-uuid', 'user-uuid');

      expect(result.message).toContain('starred');
      expect(starRepository.create).toHaveBeenCalledWith({ templateId: 'template-uuid', userId: 'user-uuid' });
      expect(starRepository.save).toHaveBeenCalled();
      expect(mockTemplateRepository.increment).toHaveBeenCalledWith({ id: 'template-uuid' }, 'starCount', 1);
      expect(kafkaClient.emit).toHaveBeenCalledWith('vibeguard.context.template_starred', expect.any(Object));
    });

    it('should unstar a template and decrease starCount', async () => {
      const template = { id: 'template-uuid', authorId: 'author-uuid', starCount: 2 };
      const star = { id: 'star-uuid', templateId: 'template-uuid', userId: 'user-uuid' };
      mockTemplateRepository.findOne.mockResolvedValue(template);
      mockStarRepository.findOne.mockResolvedValue(star);

      const result = await service.unstar('template-uuid', 'user-uuid');

      expect(result.message).toContain('unstarred');
      expect(starRepository.remove).toHaveBeenCalledWith(star);
      expect(mockUpdateQueryBuilder.update).toHaveBeenCalled();
      expect(mockUpdateQueryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('findTrending', () => {
    it('should return from cache if present', async () => {
      const cachedTrending = [{ id: '1', name: 'Trend' }];
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedTrending));

      const result = await service.findTrending();

      expect(result).toEqual(cachedTrending);
      expect(redis.get).toHaveBeenCalledWith('trending');
    });
  });
});
