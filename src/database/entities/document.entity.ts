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
import { DocumentStatus } from '../../common/enums';
import { User } from './user.entity';

@Entity('documents')
@Index(['title'])
@Index(['status'])
@Index(['createdAt'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 100 })
  mimetype: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ length: 500 })
  filePath: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  content: string; // Extracted text content for search

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @ManyToOne(() => User, (user) => user.documents, { nullable: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ name: 'created_by_id' })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy: User | null;

  @Column({ name: 'updated_by_id', nullable: true })
  updatedById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get sizeInMB(): number {
    return Math.round((Number(this.size) / 1024 / 1024) * 100) / 100;
  }
}
