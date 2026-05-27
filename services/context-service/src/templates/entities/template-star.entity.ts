import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('template_stars')
@Unique(['templateId', 'userId'])
export class TemplateStar {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  templateId!: string;

  @Column('uuid')
  userId!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
