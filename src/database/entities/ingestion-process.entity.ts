import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IngestionStatus, IngestionType } from '../../common/enums';
import { User } from './user.entity';

@Entity('ingestion_processes')
@Index(['status'])
@Index(['type'])
@Index(['createdAt'])
export class IngestionProcess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: IngestionType,
    default: IngestionType.DOCUMENT_UPLOAD,
  })
  type: IngestionType;

  @Column({
    type: 'enum',
    enum: IngestionStatus,
    default: IngestionStatus.PENDING,
  })
  status: IngestionStatus;

  @Column({ type: 'json', nullable: true })
  parameters: Record<string, any> | null;

  @Column({ type: 'json', nullable: true })
  result: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'int', default: 0 })
  totalItems: number;

  @Column({ type: 'int', default: 0 })
  processedItems: number;

  @Column({ type: 'int', default: 0 })
  failedItems: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => User, (user) => user.ingestionProcesses, { nullable: false })
  @JoinColumn({ name: 'initiated_by_id' })
  initiatedBy: User;

  @Column({ name: 'initiated_by_id' })
  initiatedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get progress(): number {
    if (this.totalItems === 0) return 0;
    return Math.round((this.processedItems / this.totalItems) * 100);
  }

  get duration(): number | null {
    if (!this.startedAt) return null;
    const endTime = this.completedAt || new Date();
    return Math.round((endTime.getTime() - this.startedAt.getTime()) / 1000);
  }
}
