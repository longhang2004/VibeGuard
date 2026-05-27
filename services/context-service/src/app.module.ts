import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { RedisModule } from './common/providers/redis.provider';
import { TemplatesModule } from './templates/templates.module';
import { Template } from './templates/entities/template.entity';
import { TemplateVersion } from './templates/entities/template-version.entity';
import { TemplateStar } from './templates/entities/template-star.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.CONTEXT_DATABASE_URL || 'postgres://postgres:postgrespassword@localhost:5432/vibeguard',
      entities: [Template, TemplateVersion, TemplateStar],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    RedisModule,
    TemplatesModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
