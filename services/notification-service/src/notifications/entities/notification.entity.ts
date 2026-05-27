import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column({ name: 'type' })
  type!: string; // ALERT | WARNING | INFO

  @Column({ name: 'title' })
  title!: string;

  @Column('text', { name: 'message' })
  message!: string;

  @Column('boolean', { name: 'read', default: false })
  read!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
