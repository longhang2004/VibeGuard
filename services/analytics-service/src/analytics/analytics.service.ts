import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ScanMetric } from './entities/scan-metric.entity';
import { TemplateCreatedMetric } from './entities/template-created-metric.entity';
import { TemplateStarredMetric } from './entities/template-starred-metric.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    @InjectRepository(ScanMetric)
    private readonly scanMetricRepository: Repository<ScanMetric>,
    @InjectRepository(TemplateCreatedMetric)
    private readonly templateCreatedRepository: Repository<TemplateCreatedMetric>,
    @InjectRepository(TemplateStarredMetric)
    private readonly templateStarredRepository: Repository<TemplateStarredMetric>,
  ) {}

  async onModuleInit() {
    // 1. Create tables if not exists
    await this.entityManager.query(`
      CREATE TABLE IF NOT EXISTS scan_metrics (
        id UUID NOT NULL,
        user_id UUID NOT NULL,
        language VARCHAR(50) NOT NULL,
        score INT NOT NULL,
        critical_count INT NOT NULL,
        high_count INT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (id, timestamp)
      );
    `);

    await this.entityManager.query(`
      CREATE TABLE IF NOT EXISTS template_created_metrics (
        id UUID NOT NULL,
        user_id UUID NOT NULL,
        project_type VARCHAR(50) NOT NULL,
        tech_stack JSONB NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (id, timestamp)
      );
    `);

    await this.entityManager.query(`
      CREATE TABLE IF NOT EXISTS template_starred_metrics (
        id UUID NOT NULL,
        template_id UUID NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        PRIMARY KEY (id, timestamp)
      );
    `);

    // 2. Create indexes for performance
    await this.entityManager.query(`
      CREATE INDEX IF NOT EXISTS idx_scan_metrics_user_timestamp ON scan_metrics (user_id, timestamp);
    `);

    await this.entityManager.query(`
      CREATE INDEX IF NOT EXISTS idx_template_created_timestamp ON template_created_metrics (timestamp);
    `);

    await this.entityManager.query(`
      CREATE INDEX IF NOT EXISTS idx_template_starred_timestamp ON template_starred_metrics (timestamp);
    `);

    // 3. Optional: TimescaleDB hypertable partitioning
    try {
      const timescaledbExists = await this.entityManager.query(`
        SELECT 1 FROM pg_extension WHERE extname = 'timescaledb'
      `);
      if (timescaledbExists.length > 0) {
        try {
          await this.entityManager.query(`
            SELECT create_hypertable('scan_metrics', 'timestamp', if_not_exists => TRUE);
          `);
        } catch (e) {
          // Suppress already partitioned errors
        }
        try {
          await this.entityManager.query(`
            SELECT create_hypertable('template_created_metrics', 'timestamp', if_not_exists => TRUE);
          `);
        } catch (e) {
          // Suppress already partitioned errors
        }
        try {
          await this.entityManager.query(`
            SELECT create_hypertable('template_starred_metrics', 'timestamp', if_not_exists => TRUE);
          `);
        } catch (e) {
          // Suppress already partitioned errors
        }
      }
    } catch (err) {
      // Suppress extension check failure
    }
  }

  // Kafka Event Logging
  async recordScan(
    userId: string,
    language: string,
    score: number,
    criticalCount: number,
    highCount: number,
    timestamp: string | Date,
  ) {
    const metric = this.scanMetricRepository.create({
      id: randomUUID(),
      userId,
      language,
      score,
      criticalCount,
      highCount,
      timestamp: new Date(timestamp),
    });
    await this.scanMetricRepository.save(metric);
  }

  async recordTemplateCreated(
    userId: string,
    projectType: string,
    techStack: string[],
    timestamp: string | Date,
  ) {
    const metric = this.templateCreatedRepository.create({
      id: randomUUID(),
      userId,
      projectType,
      techStack,
      timestamp: new Date(timestamp),
    });
    await this.templateCreatedRepository.save(metric);
  }

  async recordTemplateStarred(
    templateId: string,
    timestamp: string | Date,
  ) {
    const metric = this.templateStarredRepository.create({
      id: randomUUID(),
      templateId,
      timestamp: new Date(timestamp),
    });
    await this.templateStarredRepository.save(metric);
  }

  // Endpoints Aggregators
  async getScanSummary(userId: string) {
    // Get total scans and avg score from metrics
    const result = await this.entityManager.query(
      `SELECT COUNT(*)::int as "totalScans", COALESCE(AVG(score), 0)::float as "avgScore"
       FROM scan_metrics
       WHERE user_id = $1`,
      [userId],
    );

    const stats = result[0] || { totalScans: 0, avgScore: 0 };

    // Get most common vulnerability from main findings table
    const vulnResult = await this.entityManager.query(
      `SELECT f.title, COUNT(f.title)::int as "vuln_count"
       FROM findings f
       JOIN scans s ON f.scan_id = s.id
       WHERE s.user_id = $1
       GROUP BY f.title
       ORDER BY "vuln_count" DESC
       LIMIT 1`,
      [userId],
    );

    const mostCommonVulnerability = vulnResult.length > 0 ? vulnResult[0].title : null;

    return {
      totalScans: stats.totalScans,
      avgScore: Math.round(stats.avgScore * 10) / 10,
      mostCommonVulnerability,
    };
  }

  async getScanTrend(userId: string) {
    const trend = await this.entityManager.query(
      `SELECT TO_CHAR(timestamp, 'YYYY-MM-DD') as "date", ROUND(AVG(score))::int as "avgScore"
       FROM scan_metrics
       WHERE user_id = $1 AND timestamp >= NOW() - INTERVAL '30 days'
       GROUP BY TO_CHAR(timestamp, 'YYYY-MM-DD')
       ORDER BY "date" ASC`,
      [userId],
    );
    return trend;
  }

  async getPopularTemplates() {
    const popular = await this.entityManager.query(
      `SELECT t.id, t.name, t.description, t.project_type as "projectType", 
              t.tech_stack as "techStack", t.star_count as "starCount", COUNT(m.id)::int as "starsInPeriod"
       FROM templates t
       JOIN template_starred_metrics m ON t.id = m.template_id
       WHERE m.timestamp >= NOW() - INTERVAL '7 days'
       GROUP BY t.id
       ORDER BY "starsInPeriod" DESC
       LIMIT 10`,
    );
    return popular;
  }

  async getGlobalStats() {
    const scansCount = await this.entityManager.query(
      `SELECT COUNT(*)::int as "count" FROM scan_metrics`,
    );
    const templatesCount = await this.entityManager.query(
      `SELECT COUNT(*)::int as "count" FROM templates WHERE is_public = true AND deleted_at IS NULL`,
    );
    const avgScore = await this.entityManager.query(
      `SELECT COALESCE(AVG(score), 0)::float as "avg" FROM scan_metrics`,
    );

    return {
      totalScans: scansCount[0]?.count || 0,
      totalTemplates: templatesCount[0]?.count || 0,
      avgSecurityScore: Math.round((avgScore[0]?.avg || 0) * 10) / 10,
    };
  }
}
