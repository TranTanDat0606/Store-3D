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
  const { category, material, printerType, status, featured, minPrice, maxPrice, minRating } = query;

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
  // Plan 3 T4: minRating (public filter) — only products rated ≥ N stars.
  if (minRating !== undefined) filter.rating = { $gte: Number(minRating) };
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

/** Caller context resolved by optional auth on `GET /api/products` (Task 1b). */
export interface ProductListContext {
  /** True only when a valid token resolved `req.user.role === 'admin'`. */
  isAdmin?: boolean;
}

/**
 * Picks the filter for a product list request: admins get full pass-through
 * (so the admin products page can list/count inactive + out-of-stock items),
 * everything else — anonymous, customer, or no context at all — keeps the
 * forced-active public filter.
 */
export function buildProductListFilter(query: Query, context: ProductListContext = {}): Query {
  return context.isAdmin ? buildAdminProductFilter(query) : buildPublicProductFilter(query);
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
