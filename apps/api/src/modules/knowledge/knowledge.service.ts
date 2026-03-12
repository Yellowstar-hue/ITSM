import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { AiService } from '../ai/ai.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(Article) private articleRepository: Repository<Article>,
    private aiService: AiService,
  ) {}

  async findAll(query: { category?: string; status?: ArticleStatus; search?: string; page?: number; limit?: number }) {
    const { category, status, search, page = 1, limit = 20 } = query;
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status; else where.status = ArticleStatus.PUBLISHED;
    if (search) where.title = Like(`%${search}%`);

    const [items, total] = await this.articleRepository.findAndCount({
      where,
      order: { viewCount: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');
    await this.articleRepository.update(id, { viewCount: article.viewCount + 1 });
    return article;
  }

  async create(data: Partial<Article>): Promise<Article> {
    const article = this.articleRepository.create(data);
    return this.articleRepository.save(article);
  }

  async update(id: string, data: Partial<Article>): Promise<Article> {
    await this.articleRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const article = await this.findOne(id);
    await this.articleRepository.remove(article);
  }

  async generateFromTicket(ticket: { title: string; description: string; resolution?: string; authorId?: string; authorName?: string }): Promise<Article> {
    const generated = await this.aiService.generateKnowledgeArticle(ticket);
    const article = this.articleRepository.create({
      title: generated.title,
      content: generated.content,
      summary: generated.summary,
      tags: generated.tags,
      aiGenerated: true,
      status: ArticleStatus.UNDER_REVIEW,
      authorId: ticket.authorId,
      authorName: ticket.authorName || 'AI Generated',
    });
    return this.articleRepository.save(article);
  }

  async markHelpful(id: string, helpful: boolean): Promise<void> {
    const article = await this.findOne(id);
    if (helpful) {
      await this.articleRepository.update(id, { helpfulCount: article.helpfulCount + 1 });
    } else {
      await this.articleRepository.update(id, { notHelpfulCount: article.notHelpfulCount + 1 });
    }
  }

  async search(query: string): Promise<Article[]> {
    const articles = await this.articleRepository.find({
      where: { status: ArticleStatus.PUBLISHED },
      take: 50,
    });
    const results = await this.aiService.semanticSearch(query, articles);
    return results as Article[];
  }

  async getCategories(): Promise<string[]> {
    const results = await this.articleRepository
      .createQueryBuilder('article')
      .select('DISTINCT article.category', 'category')
      .where('article.category IS NOT NULL')
      .getRawMany();
    return results.map(r => r.category).filter(Boolean);
  }
}
