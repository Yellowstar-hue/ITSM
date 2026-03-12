import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ConfigurationItem, CIType, CIStatus } from './entities/ci.entity';

@Injectable()
export class CmdbService {
  constructor(
    @InjectRepository(ConfigurationItem) private ciRepository: Repository<ConfigurationItem>,
  ) {}

  async findAll(query: { ciType?: CIType; status?: CIStatus; search?: string; page?: number; limit?: number }) {
    const { ciType, status, search, page = 1, limit = 20 } = query;
    const where: any = {};
    if (ciType) where.ciType = ciType;
    if (status) where.status = status;
    if (search) where.name = Like(`%${search}%`);

    const [items, total] = await this.ciRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<ConfigurationItem> {
    const ci = await this.ciRepository.findOne({ where: { id } });
    if (!ci) throw new NotFoundException('Configuration item not found');
    return ci;
  }

  async create(data: Partial<ConfigurationItem>): Promise<ConfigurationItem> {
    const ci = this.ciRepository.create(data);
    return this.ciRepository.save(ci);
  }

  async update(id: string, data: Partial<ConfigurationItem>): Promise<ConfigurationItem> {
    await this.ciRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const ci = await this.findOne(id);
    await this.ciRepository.remove(ci);
  }

  async getStats() {
    const total = await this.ciRepository.count();
    const operational = await this.ciRepository.count({ where: { status: CIStatus.OPERATIONAL } });
    const degraded = await this.ciRepository.count({ where: { status: CIStatus.DEGRADED } });
    const offline = await this.ciRepository.count({ where: { status: CIStatus.OFFLINE } });
    return { total, operational, degraded, offline };
  }

  async getRelationshipMap(id: string) {
    const ci = await this.findOne(id);
    const relatedIds = ci.relationships?.map(r => r.targetId) || [];
    const related = relatedIds.length > 0
      ? await this.ciRepository.findByIds(relatedIds)
      : [];
    return { ci, relationships: related };
  }
}
