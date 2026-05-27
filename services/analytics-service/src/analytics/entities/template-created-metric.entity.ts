import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('template_created_metrics')
export class TemplateCreatedMetric {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column({ name: 'project_type' })
  projectType!: string;

  @Column('jsonb', { name: 'tech_stack' })
  techStack!: string[];

  @PrimaryColumn('timestamp', { name: 'timestamp' })
  timestamp!: Date;
}
