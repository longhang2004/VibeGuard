import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

export enum ProjectType {
  NESTJS_MONOLITH = 'NESTJS_MONOLITH',
  JAVA_SPRING = 'JAVA_SPRING',
  NEXTJS_FRONTEND = 'NEXTJS_FRONTEND',
  FULLSTACK = 'FULLSTACK',
  MICROSERVICES = 'MICROSERVICES',
  OTHER = 'OTHER',
}

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column('jsonb')
  techStack!: string[];

  @Column({
    type: 'enum',
    enum: ProjectType,
    default: ProjectType.OTHER,
  })
  projectType!: ProjectType;

  @Column('text')
  content!: string;

  @Column('uuid')
  authorId!: string;

  @Column({ default: true })
  isPublic!: boolean;

  @Column({ default: 0 })
  starCount!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
