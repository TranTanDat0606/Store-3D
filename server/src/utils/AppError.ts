export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Resource kinds that carry a canonical Vietnamese label (GAP-13). */
export type ResourceKind = 'product' | 'order' | 'review' | 'coupon' | 'address' | 'article';

/**
 * Canonical labels: `Không tìm thấy <label>` (404) and `<Label> đã tồn tại`
 * (409). Kept byte-identical to the copy already pinned by existing tests
 * (e.g. productStatus / newsDraft), so swapping a call site onto a factory
 * never changes the message the client sees.
 */
const RESOURCE_LABELS: Record<ResourceKind, string> = {
  product: 'sản phẩm',
  order: 'đơn hàng',
  review: 'đánh giá',
  coupon: 'mã giảm giá',
  address: 'địa chỉ',
  article: 'bài viết',
};

/**
 * The single forbidden copy for ownership (non-owner) rejections — GAP-13:
 * review / order / address ownership checks all answer 403 with this message
 * (wishlist is user-keyed — it has no ownership rejection path).
 */
export const FORBIDDEN_MESSAGE = 'Bạn không có quyền thực hiện thao tác này';

/** 404 — the resource does not exist. Missing is never a 400 business rule. */
export function resourceNotFound(kind: ResourceKind): AppError {
  return new AppError(`Không tìm thấy ${RESOURCE_LABELS[kind]}`, 404);
}

/** 409 — the resource already exists (duplicate create/update), never 400. */
export function duplicateResource(kind: ResourceKind): AppError {
  const label = RESOURCE_LABELS[kind];
  return new AppError(`${label.charAt(0).toUpperCase()}${label.slice(1)} đã tồn tại`, 409);
}

/**
 * 403 — the resource exists but belongs to another user. Callers must run the
 * not-found check FIRST so a genuinely missing resource keeps its 404 and a
 * foreign one is never masked as "not found".
 */
export function assertOwnership(owner: unknown, userId: unknown): void {
  if (String(owner) !== String(userId)) throw new AppError(FORBIDDEN_MESSAGE, 403);
}
