import mongoose from 'mongoose';
import type { FilterQuery, Types } from 'mongoose';
import { Product, ProductStatus, Category } from '../models';
import { AppError } from '../utils/AppError';
import { apiFeatures, parsePagination } from '../utils/apiFeatures';
import slugify from '../utils/slugify';
import type { CreateProductInput, UpdateProductInput } from '../validators/product';

type ProductFilter = FilterQuery<InstanceType<typeof Product>>;

export function toObjectId(id: string): Types.ObjectId {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new AppError('ID không hợp lệ', 400);
  }
  return new (require('mongoose').Types.ObjectId)(id);
}

async function ensureUniqueSlug(name: string, slug: string | undefined, excludeId?: string): Promise<string> {
  const base = (slug && slug.trim() ? slug : slugify(name)) || slugify(name);
  let candidate = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Product.findOne({ slug: candidate }).select('_id');
    if (!existing || (excludeId && String(existing._id) === excludeId)) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

export class ProductService {
  private buildFilter(params: Record<string, unknown>): ProductFilter {
    const filter: ProductFilter = {};
    const { category, material, printerType, status, featured, minPrice, maxPrice } = params;

    if (category) filter.category = toObjectId(String(category));
    if (material) filter.material = material;
    if (printerType) filter.printerType = printerType;
    if (status) filter.status = status;
    if (featured === 'true') filter.featured = true;
    if (featured === 'false') filter.featured = false;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.salePrice = {
        ...(minPrice !== undefined ? { $gte: Number(minPrice) } : {}),
        ...(maxPrice !== undefined ? { $lte: Number(maxPrice) } : {}),
      };
    }
    return filter;
  }

  async list(params: Record<string, unknown>) {
    if (params.sort === 'best-selling') {
      return this.listBestSelling(params);
    }
    const options = { ...parsePagination(params), searchFields: ['name', 'description'] };
    const filter = this.buildFilter(params);

    return apiFeatures(Product.find().populate('category', 'name slug image'), filter, options);
  }

  /** Sorts by total quantity sold across all orders (products with no sales included last). */
  private async listBestSelling(params: Record<string, unknown>) {
    const { page, limit, search } = parsePagination(params);
    const matchStage: Record<string, unknown> = { ...this.buildFilter(params) };
    if (search) {
      matchStage.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    const [total, docs] = await Promise.all([
      Product.countDocuments(matchStage),
      Product.aggregate([
        { $match: matchStage },
        { $lookup: { from: 'orderitems', localField: '_id', foreignField: 'product', as: '_orderItems' } },
        { $addFields: { _sold: { $sum: '$_orderItems.quantity' } } },
        { $sort: { _sold: -1, _id: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: '_category' } },
        { $unwind: { path: '$_category', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: 1, slug: 1, description: 1, images: 1, material: 1, printerType: 1,
            size: 1, stock: 1, originalPrice: 1, salePrice: 1, rating: 1, reviewCount: 1,
            status: 1, featured: 1, createdAt: 1, updatedAt: 1, category: '$_category',
          },
        },
      ]),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      data: docs as InstanceType<typeof Product>[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /** Resolves a category slug into a product filter (used by GET /products?categorySlug=...). */
  async listByCategorySlug(categorySlug: string, params: Record<string, unknown>) {
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) throw new AppError('Không tìm thấy danh mục', 404);
    return this.list({ ...params, category: String(category._id) });
  }

  async getBySlug(slug: string) {
    let product = await Product.findOne({ slug }).populate('category', 'name slug');
    if (!product && mongoose.isValidObjectId(slug)) {
      product = await Product.findById(slug).populate('category', 'name slug');
    }
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);
    return product;
  }

  async getById(id: string) {
    const product = await Product.findById(id).populate('category', 'name slug');
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);
    return product;
  }

  async related(productId: string, categoryId: string, limit = 4) {
    return Product.find({
      _id: { $ne: productId },
      category: categoryId,
      status: ProductStatus.Active,
    })
      .select('name slug images originalPrice salePrice rating material')
      .limit(limit);
  }

  async featured(params: Record<string, unknown>) {
    return this.list({ ...params, featured: 'true', status: ProductStatus.Active });
  }

  async create(data: CreateProductInput) {
    const slug = await ensureUniqueSlug(data.name, data.slug);
    const product = await Product.create({ ...data, slug });
    return this.getById(String(product._id));
  }

  async update(id: string, data: UpdateProductInput) {
    const existing = await Product.findById(id);
    if (!existing) throw new AppError('Không tìm thấy sản phẩm', 404);

    let slug = existing.slug;
    if ((data.slug && data.slug !== existing.slug) || (data.name && data.name !== existing.name)) {
      slug = await ensureUniqueSlug(data.name ?? existing.name, data.slug, id);
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { ...data, slug },
      { new: true, runValidators: true },
    );
    return this.getById(String(updated!._id));
  }

  async remove(id: string) {
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) throw new AppError('Không tìm thấy sản phẩm', 404);
    return deleted;
  }
}

export const productService = new ProductService();
