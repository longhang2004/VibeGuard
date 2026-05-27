import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('template_versions')
export class TemplateVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  templateId!: string;

  @Column()
  version!: string; // semver format

  @Column('text')
  content!: string;

  @Column()
  changelog!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
