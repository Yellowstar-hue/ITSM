import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn
} from 'typeorm';

export enum CatalogItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

@Entity('catalog_items')
export class CatalogItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ type: 'enum', enum: CatalogItemStatus, default: CatalogItemStatus.ACTIVE })
  status: CatalogItemStatus;

  @Column({ nullable: true })
  fulfillmentGroup: string;

  @Column({ nullable: true })
  slaHours: number;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  approvers: string[];

  @Column({ type: 'jsonb', nullable: true, default: [] })
  formFields: CatalogFormField[];

  @Column({ default: 0 })
  requestCount: number;

  @Column({ default: true })
  requiresApproval: boolean;

  @Column({ nullable: true })
  price: number;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface CatalogFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number';
  required: boolean;
  options?: string[];
  placeholder?: string;
}
