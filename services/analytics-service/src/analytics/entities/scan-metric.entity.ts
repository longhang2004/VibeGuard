import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('scan_metrics')
export class ScanMetric {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column({ name: 'language' })
  language!: string;

  @Column('int', { name: 'score' })
  score!: number;

  @Column('int', { name: 'critical_count' })
  criticalCount!: number;

  @Column('int', { name: 'high_count' })
  highCount!: number;

  @PrimaryColumn('timestamp', { name: 'timestamp' })
  timestamp!: Date;
}
