import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';

export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  UNDER_REVIEW = 'under_review',
}

@Entity('knowledge_articles')
@Index(['status', 'category'])
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.PUBLISHED })
  status: ArticleStatus;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  helpfulCount: number;

  @Column({ default: 0 })
  notHelpfulCount: number;

  @Column({ nullable: true })
  authorId: string;

  @Column({ nullable: true })
  authorName: string;

  @Column({ default: false })
  aiGenerated: boolean;

  @Column({ nullable: true })
  sourceTicketId: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
