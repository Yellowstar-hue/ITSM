import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn
} from 'typeorm';

export enum CIStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  DECOMMISSIONED = 'decommissioned',
}

export enum CIType {
  SERVER = 'server',
  DATABASE = 'database',
  APPLICATION = 'application',
  NETWORK_DEVICE = 'network_device',
  STORAGE = 'storage',
  VIRTUAL_MACHINE = 'virtual_machine',
  CONTAINER = 'container',
  SERVICE = 'service',
  ENDPOINT = 'endpoint',
  OTHER = 'other',
}

@Entity('configuration_items')
export class ConfigurationItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CIType, default: CIType.SERVER })
  ciType: CIType;

  @Column({ type: 'enum', enum: CIStatus, default: CIStatus.OPERATIONAL })
  status: CIStatus;

  @Column({ nullable: true })
  environment: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  hostname: string;

  @Column({ nullable: true })
  macAddress: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  osType: string;

  @Column({ nullable: true })
  osVersion: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  datacenter: string;

  @Column({ nullable: true })
  owner: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  businessService: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true, default: {} })
  attributes: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  relationships: CIRelationship[];

  @Column({ nullable: true })
  discoveredAt: Date;

  @Column({ nullable: true })
  lastScannedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface CIRelationship {
  targetId: string;
  targetName: string;
  relationshipType: string;
  direction: 'upstream' | 'downstream' | 'peer';
}
