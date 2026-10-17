import { z } from 'zod';
import { CouponType } from '../models';

export const createCouponSchema = z.object({
  code: z.string().trim().min(2, 'Mã giảm giá tối thiểu 2 ký tự').max(50, 'Mã giảm giá tối đa 50 ký tự'),
  discount: z.coerce.number().min(1, 'Giá trị giảm tối thiểu 1').max(100000000),
  type: z.enum([CouponType.Percent, CouponType.Fixed]).default(CouponType.Percent),
  expiredDate: z.coerce.date({ errorMap: () => ({ message: 'Ngày hết hạn không hợp lệ' }) }),
  quantity: z.coerce.number().int().min(0, 'Số lượng không được âm').default(0),
  minOrder: z.coerce.number().min(0).optional().default(0),
});

export const updateCouponSchema = createCouponSchema.partial();

/** Cart line used by the trusted coupon preview (GAP-14). */
export const previewItemSchema = z.object({
  product: z.string().trim().min(1, 'Sản phẩm là bắt buộc'),
  quantity: z.coerce.number().int().min(1, 'Số lượng tối thiểu 1'),
});

export const previewItemsSchema = z.array(previewItemSchema);

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã giảm giá'),
  // Both request shapes are valid: legacy `subtotal`-only (estimate) or
  // `items` (server-priced). Both stay optional for backward compatibility.
  subtotal: z.coerce.number().min(0).optional(),
  items: previewItemsSchema.optional(),
});

/**
 * Tolerant parser for the GET-preview `items` query param (URL-encoded JSON).
 * Missing or invalid input yields `undefined` so the caller falls back to the
 * claimed subtotal — an invalid `items` must never turn into a 500.
 */
export function parsePreviewItems(raw: unknown): z.infer<typeof previewItemsSchema> | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const candidate = Array.isArray(raw) ? raw[0] : raw; // repeated query keys → first value
  if (typeof candidate !== 'string') return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return undefined; // not JSON at all → ignore
  }

  const result = previewItemsSchema.safeParse(parsed);
  return result.success ? result.data : undefined;
}

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type PreviewItems = z.infer<typeof previewItemsSchema>;
