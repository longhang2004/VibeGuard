import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { ScanMetric } from './entities/scan-metric.entity';
import { TemplateCreatedMetric } from './entities/template-created-metric.entity';
import { TemplateStarredMetric } from './entities/template-starred-metric.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let entityManager: EntityManager;
  let scanMetricRepository: Repository<ScanMetric>;
  let templateCreatedRepository: Repository<TemplateCreatedMetric>;
  let templateStarredRepository: Repository<TemplateStarredMetric>;

  const mockEntityManager = {
    query: jest.fn(),
  };

  const mockScanMetricRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTemplateCreatedRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTemplateStarredRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
        {
          provide: getRepositoryToken(ScanMetric),
          useValue: mockScanMetricRepository,
        },
        {
          provide: getRepositoryToken(TemplateCreatedMetric),
          useValue: mockTemplateCreatedRepository,
        },
        {
          provide: getRepositoryToken(TemplateStarredMetric),
          useValue: mockTemplateStarredRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    entityManager = module.get<EntityManager>(EntityManager);
    scanMetricRepository = module.get<Repository<ScanMetric>>(getRepositoryToken(ScanMetric));
    templateCreatedRepository = module.get<Repository<TemplateCreatedMetric>>(getRepositoryToken(TemplateCreatedMetric));
    templateStarredRepository = module.get<Repository<TemplateStarredMetric>>(getRepositoryToken(TemplateStarredMetric));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordScan', () => {
    it('should create and save a ScanMetric record', async () => {
      const metric = { id: 'uuid-1', userId: 'user-1', language: 'ts', score: 90 };
      mockScanMetricRepository.create.mockReturnValue(metric);
      mockScanMetricRepository.save.mockResolvedValue(metric);

      await service.recordScan('user-1', 'ts', 90, 0, 1, '2026-05-27');

      expect(scanMetricRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          language: 'ts',
          score: 90,
          criticalCount: 0,
          highCount: 1,
        }),
      );
      expect(scanMetricRepository.save).toHaveBeenCalledWith(metric);
    });
  });

  describe('recordTemplateCreated', () => {
    it('should create and save a TemplateCreatedMetric record', async () => {
      const metric = { id: 'uuid-1', userId: 'user-1', projectType: 'NESTJS' };
      mockTemplateCreatedRepository.create.mockReturnValue(metric);
      mockTemplateCreatedRepository.save.mockResolvedValue(metric);

      await service.recordTemplateCreated('user-1', 'NESTJS', ['NestJS'], '2026-05-27');

      expect(templateCreatedRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          projectType: 'NESTJS',
          techStack: ['NestJS'],
        }),
      );
      expect(templateCreatedRepository.save).toHaveBeenCalledWith(metric);
    });
  });

  describe('recordTemplateStarred', () => {
    it('should create and save a TemplateStarredMetric record', async () => {
      const metric = { id: 'uuid-1', templateId: 'template-1' };
      mockTemplateStarredRepository.create.mockReturnValue(metric);
      mockTemplateStarredRepository.save.mockResolvedValue(metric);

      await service.recordTemplateStarred('template-1', '2026-05-27');

      expect(templateStarredRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'template-1',
        }),
      );
      expect(templateStarredRepository.save).toHaveBeenCalledWith(metric);
    });
  });

  describe('getScanSummary', () => {
    it('should aggregate metrics and return user scans summary', async () => {
      mockEntityManager.query
        .mockResolvedValueOnce([{ totalScans: 5, avgScore: 84.5 }]) // 1st query: aggregates
        .mockResolvedValueOnce([{ title: 'Hardcoded Secret', vuln_count: 3 }]); // 2nd query: findings

      const result = await service.getScanSummary('user-1');

      expect(result).toEqual({
        totalScans: 5,
        avgScore: 84.5,
        mostCommonVulnerability: 'Hardcoded Secret',
      });
      expect(mockEntityManager.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('getScanTrend', () => {
    it('should query trend analysis and return results', async () => {
      const trendData = [{ date: '2026-05-27', avgScore: 90 }];
      mockEntityManager.query.mockResolvedValueOnce(trendData);

      const result = await service.getScanTrend('user-1');

      expect(result).toEqual(trendData);
    });
  });

  describe('getPopularTemplates', () => {
    it('should fetch popular templates from Period', async () => {
      const popular = [{ id: 't-1', name: 'Boilerplate', starsInPeriod: 12 }];
      mockEntityManager.query.mockResolvedValueOnce(popular);

      const result = await service.getPopularTemplates();

      expect(result).toEqual(popular);
    });
  });

  describe('getGlobalStats', () => {
    it('should calculate global metrics', async () => {
      mockEntityManager.query
        .mockResolvedValueOnce([{ count: 42 }]) // scans count
        .mockResolvedValueOnce([{ count: 8 }]) // templates count
        .mockResolvedValueOnce([{ avg: 76.4 }]); // avg score

      const result = await service.getGlobalStats();

      expect(result).toEqual({
        totalScans: 42,
        totalTemplates: 8,
        avgSecurityScore: 76.4,
      });
    });
  });
});
