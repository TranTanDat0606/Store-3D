import { News, NewsStatus } from '../models';
import { AppError } from '../utils/AppError';
import { apiFeatures, parsePagination } from '../utils/apiFeatures';
import type { CreateNewsInput, UpdateNewsInput } from '../validators/news';

export class NewsService {
  /** Public: list published news. */
  async list(params: Record<string, unknown>) {
    const options = { ...parsePagination(params), searchFields: ['title', 'excerpt'] };
    const filter: Record<string, unknown> = { status: NewsStatus.Published };
    if (params.category) filter.category = params.category;
    return apiFeatures(News.find(), filter, { ...options, sort: '-publishedAt -createdAt' });
  }

  /** Admin: list all news. */
  async adminList(params: Record<string, unknown>) {
    const options = { ...parsePagination(params), searchFields: ['title', 'excerpt'] };
    const filter: Record<string, unknown> = {};
    if (params.status) filter.status = params.status;
    if (params.category) filter.category = params.category;
    return apiFeatures(News.find(), filter, { ...options, sort: '-createdAt' });
  }

  async getBySlug(slug: string) {
    const news = await News.findOne({ slug });
    if (!news) throw new AppError('Không tìm thấy bài viết', 404);
    return news;
  }

  async getById(id: string) {
    const news = await News.findById(id);
    if (!news) throw new AppError('Không tìm thấy bài viết', 404);
    return news;
  }

  async create(data: CreateNewsInput) {
    const slug = await this.ensureUniqueSlug(data.title);
    const newsData: Record<string, unknown> = { ...data, slug };
    if (data.status === NewsStatus.Published) {
      newsData.publishedAt = new Date();
    }
    return News.create(newsData);
  }

  async update(id: string, data: UpdateNewsInput) {
    const existing = await News.findById(id);
    if (!existing) throw new AppError('Không tìm thấy bài viết', 404);

    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      slug = await this.ensureUniqueSlug(data.title, id);
    }

    const updates: Record<string, unknown> = { ...data };
    if (data.title) updates.slug = slug;
    if (data.status === NewsStatus.Published && !existing.publishedAt) {
      updates.publishedAt = new Date();
    }

    const updated = await News.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    return updated;
  }

  async remove(id: string) {
    const deleted = await News.findByIdAndDelete(id);
    if (!deleted) throw new AppError('Không tìm thấy bài viết', 404);
    return deleted;
  }

  async getCategories() {
    return News.distinct('category', { status: NewsStatus.Published });
  }

  private async ensureUniqueSlug(title: string, excludeId?: string): Promise<string> {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    let candidate = base;
    let counter = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await News.findOne({ slug: candidate }).select('_id');
      if (!existing || (excludeId && String(existing._id) === excludeId)) return candidate;
      counter += 1;
      candidate = `${base}-${counter}`;
    }
  }
}

export const newsService = new NewsService();
