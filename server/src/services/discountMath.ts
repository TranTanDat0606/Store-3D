import { AppError } from '../utils/AppError';
import { MAX_DISCOUNT_VND } from '../config/rewards';

/**
 * Single source of truth for coupon discount math (GAP-2).
 *
 * Every subtotal-math site — coupon preview (`apply`, `getEligibleCoupons`,
 * `listAvailable`) and order creation (`orderService.resolveCoupon`) — must go
 * through `computeDiscount`; no site keeps its own formula, so preview and
 * order math can never drift apart.
 *
 * This module is intentionally pure: no mongoose, no models, no I/O. The
 * database product-price lookup for previews is injected via `priceLookup`.
 */

/** Coupon fields the math needs, defined once and imported by all call sites. */
export interface CouponMathInput {
  type: 'percent' | 'fixed';
  value: number;
  minOrder?: number;
  /** `'game'` reward coupons are capped by MAX_DISCOUNT_VND; everything else is not. */
  source?: string;
}

export interface DiscountResult {
  discountVnd: number;
  capped: boolean;
}

export const MIN_ORDER_MESSAGE = 'Đơn hàng chưa đạt giá trị tối thiểu để dùng mã giảm giá';

/** Computes the discount for a coupon at a subtotal. Throws 400 when the subtotal is below minOrder. */
export function computeDiscount(coupon: CouponMathInput, subtotalVnd: number): DiscountResult {
  if (subtotalVnd < (coupon.minOrder ?? 0)) {
    throw new AppError(MIN_ORDER_MESSAGE, 400);
  }

  if (coupon.type === 'percent') {
    const raw = Math.round((subtotalVnd * coupon.value) / 100);
    // Game reward coupons are the only capped kind (MAX_DISCOUNT_VND).
    if (coupon.source === 'game' && raw > MAX_DISCOUNT_VND) {
      return { discountVnd: MAX_DISCOUNT_VND, capped: true };
    }
    return { discountVnd: raw, capped: false };
  }

  // Fixed amount, never exceeding the subtotal itself.
  return { discountVnd: Math.min(coupon.value, subtotalVnd), capped: false };
}

export interface PreviewItem {
  product: string;
  quantity: number;
}

export interface PreviewSubtotalInput {
  items?: PreviewItem[];
  subtotal?: number;
}

export interface PreviewPrice {
  _id: string;
  price: number;
  discountPrice?: number;
}

export type PriceLookup = (ids: string[]) => Promise<PreviewPrice[]>;

export type PreviewBasis = 'server-priced' | 'client-claimed';

/**
 * Resolves the subtotal a coupon preview should be computed against.
 *
 * - With validated `items`: prices come from the injected (DB) lookup —
 *   `basis: 'server-priced'`, authoritative. A claimed `subtotal` is ignored.
 * - Without `items`: the claimed `subtotal` is used but flagged
 *   `basis: 'client-claimed'` — estimate only, floored at 0.
 *
 * The preview discount is then `computeDiscount` on that subtotal, which is
 * exactly what the order path does ⇒ preview math ≡ order math.
 */
export async function computePreviewSubtotal(
  input: PreviewSubtotalInput,
  priceLookup: PriceLookup,
): Promise<{ subtotalVnd: number; basis: PreviewBasis }> {
  const items = input.items ?? [];
  if (items.length > 0) {
    const ids = [...new Set(items.map((i) => i.product))];
    const prices = await priceLookup(ids);
    const byId = new Map(prices.map((p) => [String(p._id), p]));

    let subtotalVnd = 0;
    for (const item of items) {
      const priced = byId.get(item.product);
      // Unknown/stale products contribute nothing — preview is an estimate;
      // order creation rejects them outright (404/400 via assertItemsActive).
      if (!priced) continue;
      subtotalVnd += (priced.discountPrice ?? priced.price) * item.quantity;
    }
    return { subtotalVnd, basis: 'server-priced' };
  }

  return { subtotalVnd: Math.max(0, input.subtotal ?? 0), basis: 'client-claimed' };
}
