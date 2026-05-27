import { Injectable } from '@nestjs/common';
import { ProjectType } from './entities/template.entity';

@Injectable()
export class TemplateGeneratorService {
  private readonly baseTemplates: Record<ProjectType, string> = {
    [ProjectType.NESTJS_MONOLITH]: `# CLAUDE.md — {{projectName}}

## Project Overview
This is a NestJS Monolith application configured for the following tech stack:
{{techStack}}

## Development Conventions
- **Naming Conventions:** camelCase for variables/functions, PascalCase for classes/modules, kebab-case for file names.
- **Style:** Strict TypeScript checking, camelCase for controllers and services.
- **API Response:** Standard format \`{ success, data, error, meta }\`.

## Custom Team Conventions
{{conventions}}
`,
    [ProjectType.JAVA_SPRING]: `# CLAUDE.md — {{projectName}}

## Project Overview
This is a Java Spring Boot application configured for the following tech stack:
{{techStack}}

## Development Conventions
- **Naming Conventions:** camelCase for variables/functions, PascalCase for classes, PascalCase for file names.
- **Style:** Spring Boot 3.x guidelines, Maven packages, standard service-repository architecture.

## Custom Team Conventions
{{conventions}}
`,
    [ProjectType.NEXTJS_FRONTEND]: `# CLAUDE.md — {{projectName}}

## Project Overview
This is a Next.js frontend application configured for the following tech stack:
{{techStack}}

## Development Conventions
- **Naming Conventions:** camelCase for variables/functions, PascalCase for components, kebab-case for file names.
- **Style:** React 19 / Next.js 15 App Router standard structures.

## Custom Team Conventions
{{conventions}}
`,
    [ProjectType.FULLSTACK]: `# CLAUDE.md — {{projectName}}

## Project Overview
This is a Fullstack application configured for the following tech stack:
{{techStack}}

## Development Conventions
- **Frontend Naming:** camelCase for variables, PascalCase for components, kebab-case for file names.
- **Backend Naming:** camelCase for variables, PascalCase for classes, kebab-case for file names.
- **Style:** Clear segregation between frontend and backend source directories.

## Custom Team Conventions
{{conventions}}
`,
    [ProjectType.MICROSERVICES]: `# CLAUDE.md — {{projectName}}

## Project Overview
This is a Microservices platform configured for the following tech stack:
{{techStack}}

## Development Conventions
- **Architecture:** Microservices-based, event-driven communication (Kafka/RabbitMQ).
- **Communication:** REST APIs for ingress, Kafka topics for asynchronous inter-service alerts.
- **Topic Convention:** \`{{projectName}}.<service>.<event>\`.

## Custom Team Conventions
{{conventions}}
`,
    [ProjectType.OTHER]: `# CLAUDE.md — {{projectName}}

## Project Overview
This project is configured for the following tech stack:
{{techStack}}

## Custom Team Conventions
{{conventions}}
`,
  };

  generate(projectName: string, projectType: ProjectType, techStack: string[], conventions?: any): string {
    const baseTemplate = this.baseTemplates[projectType] || this.baseTemplates[ProjectType.OTHER];

    const formattedStack = techStack && techStack.length > 0
      ? techStack.map(tech => `- ${tech}`).join('\n')
      : '- No technologies specified.';

    const formattedConventions = this.formatConventions(conventions);

    return baseTemplate
      .replace(/\{\{projectName\}\}/g, projectName)
      .replace(/\{\{techStack\}\}/g, formattedStack)
      .replace(/\{\{conventions\}\}/g, formattedConventions);
  }

  private formatConventions(conventions?: any): string {
    if (!conventions) {
      return 'No custom conventions specified.';
    }

    if (Array.isArray(conventions)) {
      return conventions.map(c => `- ${c}`).join('\n');
    }

    if (typeof conventions === 'object') {
      return Object.entries(conventions)
        .map(([key, val]) => `### ${key}\n${val}`)
        .join('\n\n');
    }

    return String(conventions);
  }
}
