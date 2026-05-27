import { Injectable, NotFoundException, ForbiddenException, Inject, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import Redis from 'ioredis';
import * as semver from 'semver';
import { Template, ProjectType } from './entities/template.entity';
import { TemplateVersion } from './entities/template-version.entity';
import { TemplateStar } from './entities/template-star.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { REDIS_CLIENT } from '../common/providers/redis.provider';

@Injectable()
export class TemplatesService implements OnModuleInit {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(TemplateVersion)
    private readonly versionRepository: Repository<TemplateVersion>,
    @InjectRepository(TemplateStar)
    private readonly starRepository: Repository<TemplateStar>,
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async onModuleInit() {
    // Connect to Kafka broker
    try {
      await this.kafkaClient.connect();
      console.log('context-service successfully connected to Kafka');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('context-service failed to connect to Kafka:', errMsg);
    }
  }

  async create(createTemplateDto: CreateTemplateDto, authorId: string) {
    const template = this.templateRepository.create({
      ...createTemplateDto,
      authorId,
      starCount: 0,
    });

    const savedTemplate = await this.templateRepository.save(template);

    // Auto-create version 1.0.0
    const version = this.versionRepository.create({
      templateId: savedTemplate.id,
      version: '1.0.0',
      content: savedTemplate.content,
      changelog: 'Initial creation',
    });
    await this.versionRepository.save(version);

    // Publish Kafka Event
    this.emitEvent('vibeguard.context.template_created', {
      templateId: savedTemplate.id,
      authorId: savedTemplate.authorId,
      projectType: savedTemplate.projectType,
      techStack: savedTemplate.techStack,
      timestamp: new Date().toISOString(),
    });

    // Invalidate trending cache
    await this.redis.del('trending');

    return {
      ...savedTemplate,
      isOwner: true,
    };
  }

  async findAll(
    projectType?: ProjectType,
    techStack?: string[],
    limit: number = 10,
    cursor?: string,
    currentUserId?: string,
  ) {
    const query = this.templateRepository.createQueryBuilder('template');
    query.where('template.isPublic = :isPublic', { isPublic: true });

    if (projectType) {
      query.andWhere('template.projectType = :projectType', { projectType });
    }

    if (techStack && techStack.length > 0) {
      // Postgres jsonb containment check (checks if array contains all stack elements)
      query.andWhere('template.techStack::jsonb @> :techStackJson', {
        techStackJson: JSON.stringify(techStack),
      });
    }

    // Default sorting: newer templates first, stable tie-breaker on ID
    query.orderBy('template.createdAt', 'DESC')
         .addOrderBy('template.id', 'DESC');

    // Limit is limit + 1 to check if hasNextPage
    query.take(limit + 1);

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('ascii'));
        query.andWhere(
          '(template.createdAt < :createdAtCursor OR (template.createdAt = :createdAtCursor AND template.id < :idCursor))',
          {
            createdAtCursor: new Date(decoded.createdAt),
            idCursor: decoded.id,
          },
        );
      } catch (err) {
        // Suppress invalid cursor errors and fallback to start page
      }
    }

    const items = await query.getMany();
    
    let hasNextPage = false;
    let nextCursor: string | undefined = undefined;

    if (items.length > limit) {
      hasNextPage = true;
      items.pop(); // Remove the extra item
      
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({
          createdAt: lastItem.createdAt.toISOString(),
          id: lastItem.id,
        }),
      ).toString('base64');
    }

    // Format list response: strip authorId, inject isOwner
    const mappedItems = items.map(item => {
      const { authorId, ...rest } = item;
      return {
        ...rest,
        isOwner: currentUserId === authorId,
      };
    });

    return {
      items: mappedItems,
      nextCursor,
      hasNextPage,
    };
  }

  async findOne(id: string, currentUserId?: string) {
    const cacheKey = `template:${id}`;
    let template: Template | null = null;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        template = JSON.parse(cached);
      }
    } catch (err) {
      // Suppress cache read errors
    }

    if (!template) {
      template = await this.templateRepository.findOne({ where: { id } });
      if (!template) {
        throw new NotFoundException('Template not found');
      }

      try {
        await this.redis.set(cacheKey, JSON.stringify(template), 'EX', 300); // 5 min TTL
      } catch (err) {
        // Suppress cache write errors
      }
    }

    // Hydrate Date fields from JSON (Redis returns strings)
    if (template.createdAt && typeof template.createdAt === 'string') {
      template.createdAt = new Date(template.createdAt);
    }
    if (template.updatedAt && typeof template.updatedAt === 'string') {
      template.updatedAt = new Date(template.updatedAt);
    }

    const { authorId, ...rest } = template;
    return {
      ...rest,
      isOwner: currentUserId === authorId,
    };
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto, currentUserId: string) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.authorId !== currentUserId) {
      throw new ForbiddenException('You do not own this template');
    }

    // 1. Determine next patch version using semver
    const latestVersion = await this.versionRepository.findOne({
      where: { templateId: id },
      order: { createdAt: 'DESC' },
    });

    let nextVer = '1.0.1';
    if (latestVersion) {
      nextVer = semver.inc(latestVersion.version, 'patch') || '1.0.1';
    }

    // 2. Update Template details
    const { changelog, ...updateFields } = updateTemplateDto;
    Object.assign(template, updateFields);
    const updatedTemplate = await this.templateRepository.save(template);

    // 3. Create TemplateVersion record
    const versionRecord = this.versionRepository.create({
      templateId: id,
      version: nextVer,
      content: updatedTemplate.content,
      changelog,
    });
    await this.versionRepository.save(versionRecord);

    // 4. Invalidate caches
    await this.redis.del(`template:${id}`);
    await this.redis.del('trending');

    return {
      ...updatedTemplate,
      isOwner: true,
    };
  }

  async remove(id: string, currentUserId: string) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.authorId !== currentUserId) {
      throw new ForbiddenException('You do not own this template');
    }

    await this.templateRepository.softRemove(template);

    // Invalidate caches
    await this.redis.del(`template:${id}`);
    await this.redis.del('trending');

    return { message: 'Template successfully deleted' };
  }

  async findVersions(templateId: string) {
    // Verify template exists
    const templateExists = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!templateExists) {
      throw new NotFoundException('Template not found');
    }

    return this.versionRepository.find({
      where: { templateId },
      order: { createdAt: 'DESC' },
    });
  }

  async findVersionContent(templateId: string, versionString: string) {
    const version = await this.versionRepository.findOne({
      where: { templateId, version: versionString },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionString} not found for this template`);
    }

    return {
      version: version.version,
      content: version.content,
      changelog: version.changelog,
      createdAt: version.createdAt,
    };
  }

  async star(id: string, userId: string) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const existingStar = await this.starRepository.findOne({
      where: { templateId: id, userId },
    });

    if (!existingStar) {
      const star = this.starRepository.create({ templateId: id, userId });
      await this.starRepository.save(star);

      // Atomically increment star count to avoid race conditions
      await this.templateRepository.increment({ id }, 'starCount', 1);

      // Invalidate caches
      await this.redis.del(`template:${id}`);
      await this.redis.del('trending');

      // Publish Starred Event
      this.emitEvent('vibeguard.context.template_starred', {
        templateId: id,
        userId,
        authorId: template.authorId,
        timestamp: new Date().toISOString(),
      });
    }

    return { message: 'Template successfully starred' };
  }

  async unstar(id: string, userId: string) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const star = await this.starRepository.findOne({
      where: { templateId: id, userId },
    });

    if (star) {
      await this.starRepository.remove(star);

      // Atomically decrement star count safely
      await this.templateRepository
        .createQueryBuilder()
        .update(Template)
        .set({ starCount: () => 'GREATEST(star_count - 1, 0)' })
        .where('id = :id', { id })
        .execute();

      // Invalidate caches
      await this.redis.del(`template:${id}`);
      await this.redis.del('trending');
    }

    return { message: 'Template successfully unstarred' };
  }

  async findTrending() {
    const cacheKey = 'trending';

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      // Suppress cache reads
    }

    // Top 10 stars in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingStars = await this.starRepository
      .createQueryBuilder('star')
      .select('star.templateId', 'templateId')
      .addSelect('COUNT(star.id)', 'starsCount')
      .where('star.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .groupBy('star.templateId')
      .orderBy('COUNT(star.id)', 'DESC')
      .limit(10)
      .getRawMany();

    let trendingTemplates: Template[] = [];

    if (trendingStars.length > 0) {
      const templateIds = trendingStars.map(s => s.templateId);
      const templates = await this.templateRepository.findBy({ id: In(templateIds) });
      
      // Sort templates to match the trending ranking
      trendingTemplates = trendingStars
        .map(starInfo => templates.find(t => t.id === starInfo.templateId))
        .filter((t): t is Template => !!t);
    } else {
      // Fallback: Global top 10 starred templates
      trendingTemplates = await this.templateRepository.find({
        where: { isPublic: true },
        order: { starCount: 'DESC' },
        take: 10,
      });
    }

    try {
      await this.redis.set(cacheKey, JSON.stringify(trendingTemplates), 'EX', 600); // 10 min TTL
    } catch (err) {
      // Suppress cache writes
    }

    return trendingTemplates;
  }

  private emitEvent(topic: string, payload: any) {
    try {
      this.kafkaClient.emit(topic, payload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`Failed to publish event to topic ${topic}:`, errMsg);
    }
  }
}
