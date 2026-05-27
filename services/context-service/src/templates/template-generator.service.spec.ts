import { Test, TestingModule } from '@nestjs/testing';
import { TemplateGeneratorService } from './template-generator.service';
import { ProjectType } from './entities/template.entity';

describe('TemplateGeneratorService', () => {
  let service: TemplateGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateGeneratorService],
    }).compile();

    service = module.get<TemplateGeneratorService>(TemplateGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate NestJS monolith markdown with project overview and custom conventions', () => {
    const projectName = 'VibeGuard';
    const techStack = ['NestJS', 'TypeScript', 'Redis'];
    const conventions = {
      'Database Rules': 'Always use SnakeCase for columns.',
      'Auth Rules': 'Always protect routes using JwtAuthGuard.',
    };

    const output = service.generate(projectName, ProjectType.NESTJS_MONOLITH, techStack, conventions);

    expect(output).toContain('# CLAUDE.md — VibeGuard');
    expect(output).toContain('- NestJS');
    expect(output).toContain('- TypeScript');
    expect(output).toContain('- Redis');
    expect(output).toContain('### Database Rules');
    expect(output).toContain('Always use SnakeCase for columns.');
    expect(output).toContain('### Auth Rules');
    expect(output).toContain('Always protect routes using JwtAuthGuard.');
  });

  it('should support array format for conventions', () => {
    const projectName = 'SpringApp';
    const techStack = ['Java', 'Spring Boot'];
    const conventions = ['Rule 1: Use JpaRepository', 'Rule 2: Compile on Java 21'];

    const output = service.generate(projectName, ProjectType.JAVA_SPRING, techStack, conventions);

    expect(output).toContain('# CLAUDE.md — SpringApp');
    expect(output).toContain('- Rule 1: Use JpaRepository');
    expect(output).toContain('- Rule 2: Compile on Java 21');
  });

  it('should support raw string format for conventions', () => {
    const projectName = 'NextApp';
    const techStack = ['Next.js', 'React'];
    const conventions = 'This is a single raw convention line.';

    const output = service.generate(projectName, ProjectType.NEXTJS_FRONTEND, techStack, conventions);

    expect(output).toContain('# CLAUDE.md — NextApp');
    expect(output).toContain('This is a single raw convention line.');
  });
});
