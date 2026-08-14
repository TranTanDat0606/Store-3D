import { Category, Product } from '../models';
import { AppError } from '../utils/AppError';
import { apiFeatures, parsePagination } from '../utils/apiFeatures';
import slugify from '../utils/slugify';
import type { CreateCategoryInput, UpdateCategoryInput } from '../validators/category';

async function ensureUniqueSlug(name: string, slug: string | undefined, excludeId?: string): Promise<string> {
  const base = (slug && slug.trim() ? slug : slugify(name)) || slugify(name);
  let candidate = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Category.findOne({ slug: candidate }).select('_id');
    if (!existing || (excludeId && String(existing._id) === excludeId)) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

export class CategoryService {
  async list(params: Record<string, unknown>) {
    const options = parsePagination(params);
    return apiFeatures(Category.find(), {}, options);
  }

  /** All categories (for nav/filter dropdowns), no pagination. */
  async all() {
    return Category.aggregate([
      { $sort: { name: 1 } },
      { $lookup: { from: 'products', localField: '_id', foreignField: 'category', as: '__products' } },
      { $addFields: { productCount: { $size: '$__products' } } },
      { $project: { __products: 0 } },
    ]);
  }

  async getBySlug(slug: string) {
    const category = await Category.findOne({ slug });
    if (!category) throw new AppError('Không tìm thấy danh mục', 404);
    return category;
  }

  async getById(id: string) {
    const category = await Category.findById(id);
    if (!category) throw new AppError('Không tìm thấy danh mục', 404);
    return category;
  }

  async create(data: CreateCategoryInput) {
    const slug = await ensureUniqueSlug(data.name, data.slug);
    const category = await Category.create({ ...data, slug });
    return this.getById(String(category._id));
  }

  async update(id: string, data: UpdateCategoryInput) {
    const existing = await Category.findById(id);
    if (!existing) throw new AppError('Không tìm thấy danh mục', 404);

    let slug = existing.slug;
    if ((data.slug && data.slug !== existing.slug) || (data.name && data.name !== existing.name)) {
      slug = await ensureUniqueSlug(data.name ?? existing.name, data.slug, id);
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { ...data, slug },
      { new: true, runValidators: true },
    );
    return this.getById(String(updated!._id));
  }

  async remove(id: string) {
    const count = await Product.countDocuments({ category: id });
    if (count > 0) {
      throw new AppError('Không thể xóa danh mục đang có sản phẩm', 400);
    }
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) throw new AppError('Không tìm thấy danh mục', 404);
    return deleted;
  }
}

export const categoryService = new CategoryService();
