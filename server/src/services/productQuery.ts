import mongoose from 'mongoose';
import { ProductStatus } from '../models';
import { AppError } from '../utils/AppError';

type Query = Record<string, unknown>;

/**
 * Validates a product/category id from the request and converts it to an ObjectId.
 * Lives here (not in productService) so the pure filter builders stay free of a
 * circular import; productService re-exports it for existing callers.
 */
export function toObjectId(id: string): mongoose.Types.ObjectId {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new AppError('ID không hợp lệ', 400);
  }
  return new mongoose.Types.ObjectId(id);
}

/** Admin/internal filter: every parameter (incl. `status`) passes through untouched. */
export function buildAdminProductFilter(query: Query): Query {
  const filter: Query = {};
  const { category, material, printerType, status, featured, minPrice, maxPrice } = query;

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

/**
 * Public filter: only active products are ever listed, no matter what the
 * client asks for (GAP-1). `status` is forced AFTER the pass-through build so
 * a request-provided status can never win.
 */
export function buildPublicProductFilter(query: Query): Query {
  return { ...buildAdminProductFilter(query), status: ProductStatus.Active };
}

/**
 * Order-creation guard (GAP-1): every requested item must resolve to an
 * existing product (404) and that product must still be sellable (400).
 * Stock sufficiency stays in `orderService.create`.
 */
export function assertItemsActive(
  products: Array<{ _id: unknown; status: string }>,
  requested: Array<{ product: unknown; quantity: number }>,
): void {
  const available = new Set(products.map((p) => String(p._id)));
  for (const item of requested) {
    if (!available.has(String(item.product))) {
      throw new AppError('Không tìm thấy sản phẩm', 404);
    }
  }
  for (const product of products) {
    if (product.status !== ProductStatus.Active) {
      throw new AppError('Sản phẩm không khả dụng hoặc đã ngừng kinh doanh', 400);
    }
  }
}
