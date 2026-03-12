import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogItem, CatalogItemStatus } from './entities/catalog-item.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(CatalogItem) private catalogRepository: Repository<CatalogItem>,
  ) {}

  async findAll(query: { category?: string; status?: CatalogItemStatus } = {}) {
    const where: any = { status: CatalogItemStatus.ACTIVE };
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    return this.catalogRepository.find({ where, order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findOne(id: string): Promise<CatalogItem> {
    const item = await this.catalogRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Catalog item not found');
    return item;
  }

  async create(data: Partial<CatalogItem>): Promise<CatalogItem> {
    const item = this.catalogRepository.create(data);
    return this.catalogRepository.save(item);
  }

  async update(id: string, data: Partial<CatalogItem>): Promise<CatalogItem> {
    await this.catalogRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.catalogRepository.remove(item);
  }

  async getCategories(): Promise<string[]> {
    const result = await this.catalogRepository
      .createQueryBuilder('c')
      .select('DISTINCT c.category', 'category')
      .where('c.category IS NOT NULL')
      .getRawMany();
    return result.map(r => r.category).filter(Boolean);
  }

  async incrementRequestCount(id: string): Promise<void> {
    await this.catalogRepository.increment({ id }, 'requestCount', 1);
  }
}
