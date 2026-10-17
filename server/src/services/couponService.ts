import { Coupon, UserCoupon, Product } from '../models';
import { AppError, duplicateResource, resourceNotFound } from '../utils/AppError';
import {
  computeDiscount,
  computePreviewSubtotal,
  type PreviewBasis,
  type PreviewItem,
} from './discountMath';
import type { CreateCouponInput, UpdateCouponInput, ApplyCouponInput } from '../validators/coupon';

/**
 * Pure seam (GAP-8): the conditional atomic consumption of one coupon usage.
 * The filter only matches while `usedCount < quantity` ($expr compares the two
 * fields inside MongoDB), and the $inc rides in the SAME findOneAndUpdate —
 * there is no separate check-then-increment window. A null result means the
 * last unit went to a concurrent order.
 */
export function couponQuantityGuardQuery(couponId: unknown): {
  filter: Record<string, unknown>;
  update: Record<string, unknown>;
} {
  return {
    filter: { _id: couponId, $expr: { $lt: ['$usedCount', '$quantity'] } },
    update: { $inc: { usedCount: 1 } },
  };
}

/** Pure seam (GAP-8): a missed quantity guard is a sold-out coupon, never a missing one. */
export function assertCouponQuantityApplied<T>(consumed: T): NonNullable<T> {
  if (consumed == null) throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
  return consumed;
}

export interface PreviewRequest {
  code?: string;
  items?: PreviewItem[];
  subtotal?: number;
  userId?: string;
}

export interface PreviewResult {
  subtotalVnd: number;
  basis: PreviewBasis;
  discountVnd: number;
  capped: boolean;
  coupon: unknown;
}

export class CouponService {
  async list() {
    return Coupon.find().sort({ createdAt: -1 });
  }

  async getById(id: string) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw resourceNotFound('coupon');
    return coupon;
  }

  async create(data: CreateCouponInput) {
    const existing = await Coupon.findOne({ code: data.code.toUpperCase().trim() });
    if (existing) throw duplicateResource('coupon');
    return Coupon.create({ ...data, code: data.code.toUpperCase().trim() });
  }

  async update(id: string, data: UpdateCouponInput) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw resourceNotFound('coupon');

    if (data.code && data.code.toUpperCase().trim() !== coupon.code) {
      const existing = await Coupon.findOne({ code: data.code.toUpperCase().trim() });
      if (existing) throw duplicateResource('coupon');
    }

    const updated = await Coupon.findByIdAndUpdate(
      id,
      {
        ...data,
        ...(data.code ? { code: data.code.toUpperCase().trim() } : {}),
      },
      { new: true, runValidators: true },
    );
    return updated;
  }

  async remove(id: string) {
    const deleted = await Coupon.findByIdAndDelete(id);
    if (!deleted) throw resourceNotFound('coupon');
    return deleted;
  }

  /** Public: validate a coupon and compute the discount for a given subtotal. */
  async apply(data: ApplyCouponInput, userId?: string) {
    const normalizedCode = data.code.toUpperCase().trim();
    const subtotalVnd = data.subtotal ?? 0;

    // Try admin Coupon first
    const coupon = await Coupon.findOne({ code: normalizedCode });
    if (coupon) {
      if (coupon.quantity <= coupon.usedCount) throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
      if (coupon.expiredDate < new Date()) throw new AppError('Mã giảm giá đã hết hạn', 400);

      const { discountVnd: discount, capped } = computeDiscount(
        { type: coupon.type, value: coupon.discount, minOrder: coupon.minOrder, source: 'admin' },
        subtotalVnd,
      );

      return { coupon, discount, capped };
    }

    // Fallback: check per-user reward coupons (game-earned)
    if (userId) {
      const userCoupon = await UserCoupon.findOne({
        code: normalizedCode,
        user: userId,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      });
      if (userCoupon) {
        const { discountVnd: discount, capped } = computeDiscount(
          { type: userCoupon.type, value: userCoupon.discount, minOrder: 0, source: 'game' },
          subtotalVnd,
        );
        return {
          coupon: { _id: userCoupon._id, code: userCoupon.code, discount: userCoupon.discount, type: userCoupon.type, expiredDate: userCoupon.expiresAt, quantity: 1, usedCount: 0, minOrder: 0 },
          discount,
          capped,
        };
      }
    }

    // GAP-13: an unknown code is a missing resource (404), same as the admin
    // path — exhausted/expired/minOrder coupons stay 400 business rules above.
    throw resourceNotFound('coupon');
  }

  /** DB product-price lookup backing the trusted preview — prices never come from the request. */
  private async lookupPrices(ids: string[]) {
    const products = await Product.find({ _id: { $in: ids } });
    return products.map((p) => ({ _id: String(p._id), price: p.salePrice }));
  }

  /**
   * Trusted coupon preview (GAP-14): resolves the subtotal server-side (DB
   * prices when `items` are given, otherwise the client-claimed `subtotal` as
   * an estimate) and computes the discount through the same `computeDiscount`
   * the order path uses — so preview math ≡ order math.
   */
  async resolvePreview(input: PreviewRequest): Promise<PreviewResult> {
    const { subtotalVnd, basis } = await computePreviewSubtotal(
      { items: input.items, subtotal: input.subtotal },
      (ids) => this.lookupPrices(ids),
    );

    if (!input.code) {
      return { subtotalVnd, basis, discountVnd: 0, capped: false, coupon: null };
    }

    const applied = await this.apply({ code: input.code, subtotal: subtotalVnd }, input.userId);
    return {
      subtotalVnd,
      basis,
      discountVnd: applied.discount,
      capped: applied.capped,
      coupon: applied.coupon,
    };
  }

  /** List all eligible coupons for a user at a given subtotal (admin + game coupons). */
  async getEligibleCoupons(subtotal: number, userId?: string, basis?: PreviewBasis) {
    const now = new Date();
    const results: Array<{
      _id: string;
      code: string;
      discount: number;
      type: string;
      expiredDate: Date;
      quantity: number;
      usedCount: number;
      minOrder: number;
      source: 'admin' | 'game';
      estimatedDiscountAmount: number;
      isApplicable: boolean;
      basis?: PreviewBasis;
      reason?: string;
    }> = [];

    // 1. Admin coupons: not expired, global usage available
    const adminCoupons = await Coupon.find({
      expiredDate: { $gt: now },
      $expr: { $or: [{ $eq: ['$quantity', 0] }, { $lt: ['$usedCount', '$quantity'] }] },
    });

    for (const c of adminCoupons) {
      const isApplicable = subtotal >= (c.minOrder || 0);
      // Single-source math; inapplicable coupons cannot have a real discount.
      const estimated = isApplicable
        ? computeDiscount({ type: c.type, value: c.discount, minOrder: c.minOrder, source: 'admin' }, subtotal).discountVnd
        : 0;
      results.push({
        _id: String(c._id),
        code: c.code,
        discount: c.discount,
        type: c.type,
        expiredDate: c.expiredDate,
        quantity: c.quantity,
        usedCount: c.usedCount,
        minOrder: c.minOrder,
        source: 'admin',
        estimatedDiscountAmount: estimated,
        isApplicable,
        ...(basis ? { basis } : {}),
        reason: !isApplicable && c.minOrder > 0
          ? `Đơn tối thiểu ${c.minOrder.toLocaleString('vi-VN')}đ`
          : undefined,
      });
    }

    // 2. User game coupons: belong to user, not expired, not used
    if (userId) {
      const userCoupons = await UserCoupon.find({
        user: userId,
        usedAt: null,
        expiresAt: { $gt: now },
      });

      for (const uc of userCoupons) {
        // Game reward coupons are always MAX_DISCOUNT_VND-capped via computeDiscount.
        const estimated = computeDiscount({ type: uc.type, value: uc.discount, minOrder: 0, source: 'game' }, subtotal).discountVnd;
        results.push({
          _id: String(uc._id),
          code: uc.code,
          discount: uc.discount,
          type: uc.type,
          expiredDate: uc.expiresAt,
          quantity: 1,
          usedCount: 0,
          minOrder: 0,
          source: 'game',
          estimatedDiscountAmount: estimated,
          isApplicable: true,
          ...(basis ? { basis } : {}),
        });
      }
    }

    // Sort by estimated discount descending
    results.sort((a, b) => b.estimatedDiscountAmount - a.estimatedDiscountAmount);

    return results;
  }

  /** List coupons available for a given subtotal. */
  async listAvailable(subtotal: number, basis?: PreviewBasis) {
    const now = new Date();
    const coupons = await Coupon.find({
      expiredDate: { $gt: now },
      $expr: { $or: [{ $eq: ['$quantity', 0] }, { $lt: ['$usedCount', '$quantity'] }] },
    }).sort({ createdAt: -1 });

    return coupons.map((c) => {
      const isApplicable = subtotal >= (c.minOrder || 0);
      return {
        ...c.toObject(),
        isApplicable,
        estimatedDiscountAmount: isApplicable
          ? computeDiscount({ type: c.type, value: c.discount, minOrder: c.minOrder, source: 'admin' }, subtotal).discountVnd
          : 0,
        ...(basis ? { basis } : {}),
        reason: !isApplicable
          ? `Đơn tối thiểu ${c.minOrder.toLocaleString('vi-VN')}đ`
          : undefined,
      };
    });
  }
}

export const couponService = new CouponService();
