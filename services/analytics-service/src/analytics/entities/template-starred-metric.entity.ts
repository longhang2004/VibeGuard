import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('template_starred_metrics')
export class TemplateStarredMetric {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'template_id' })
  templateId!: string;

  @PrimaryColumn('timestamp', { name: 'timestamp' })
  timestamp!: Date;
}
