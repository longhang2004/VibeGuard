import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TemplateGeneratorService } from './template-generator.service';
import { Template } from './entities/template.entity';
import { TemplateVersion } from './entities/template-version.entity';
import { TemplateStar } from './entities/template-star.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Template, TemplateVersion, TemplateStar]),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'context-service',
            brokers: (process.env.CONTEXT_KAFKA_BROKERS || 'localhost:9092').split(','),
          },
          consumer: {
            groupId: 'context-service-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplateGeneratorService],
  exports: [TemplatesService, TemplateGeneratorService],
})
export class TemplatesModule {}
