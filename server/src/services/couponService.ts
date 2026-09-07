import { Coupon, CouponType, UserCoupon } from '../models';
import { AppError } from '../utils/AppError';
import { MAX_DISCOUNT_VND } from '../config/rewards';
import type { CreateCouponInput, UpdateCouponInput, ApplyCouponInput } from '../validators/coupon';

/** Compute estimated discount for a coupon against a subtotal. */
function computeEstimatedDiscount(coupon: { type: string; discount: number }, subtotal: number): number {
  if (coupon.type === CouponType.Percent) {
    return Math.round((subtotal * coupon.discount) / 100);
  }
  return Math.min(coupon.discount, subtotal);
}

/** Cap a game coupon's discount by MAX_DISCOUNT_VND. */
function capGameDiscount(discount: number): number {
  return Math.min(discount, MAX_DISCOUNT_VND);
}

export class CouponService {
  async list() {
    return Coupon.find().sort({ createdAt: -1 });
  }

  async getById(id: string) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new AppError('Không tìm thấy mã giảm giá', 404);
    return coupon;
  }

  async create(data: CreateCouponInput) {
    const existing = await Coupon.findOne({ code: data.code.toUpperCase().trim() });
    if (existing) throw new AppError('Mã giảm giá đã tồn tại', 409);
    return Coupon.create({ ...data, code: data.code.toUpperCase().trim() });
  }

  async update(id: string, data: UpdateCouponInput) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new AppError('Không tìm thấy mã giảm giá', 404);

    if (data.code && data.code.toUpperCase().trim() !== coupon.code) {
      const existing = await Coupon.findOne({ code: data.code.toUpperCase().trim() });
      if (existing) throw new AppError('Mã giảm giá đã tồn tại', 409);
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
    if (!deleted) throw new AppError('Không tìm thấy mã giảm giá', 404);
    return deleted;
  }

  /** Public: validate a coupon and compute the discount for a given subtotal. */
  async apply(data: ApplyCouponInput, userId?: string) {
    const normalizedCode = data.code.toUpperCase().trim();

    // Try admin Coupon first
    const coupon = await Coupon.findOne({ code: normalizedCode });
    if (coupon) {
      if (coupon.quantity <= coupon.usedCount) throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
      if (coupon.expiredDate < new Date()) throw new AppError('Mã giảm giá đã hết hạn', 400);
      if (coupon.minOrder > 0 && data.subtotal < coupon.minOrder) {
        throw new AppError(`Đơn hàng tối thiểu ${coupon.minOrder.toLocaleString('vi-VN')}đ để sử dụng mã này`, 400);
      }

      let discount = 0;
      if (coupon.type === CouponType.Percent) {
        discount = Math.round((data.subtotal * coupon.discount) / 100);
      } else {
        discount = Math.min(coupon.discount, data.subtotal);
      }

      return { coupon, discount };
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
        const discount = Math.min(
          Math.round((data.subtotal * userCoupon.discount) / 100),
          MAX_DISCOUNT_VND,
        );
        return {
          coupon: { _id: userCoupon._id, code: userCoupon.code, discount: userCoupon.discount, type: userCoupon.type, expiredDate: userCoupon.expiresAt, quantity: 1, usedCount: 0, minOrder: 0 },
          discount,
        };
      }
    }

    throw new AppError('Mã giảm giá không tồn tại', 400);
  }

  /** List all eligible coupons for a user at a given subtotal (admin + game coupons). */
  async getEligibleCoupons(subtotal: number, userId?: string) {
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
      reason?: string;
    }> = [];

    // 1. Admin coupons: not expired, global usage available
    const adminCoupons = await Coupon.find({
      expiredDate: { $gt: now },
      $expr: { $or: [{ $eq: ['$quantity', 0] }, { $lt: ['$usedCount', '$quantity'] }] },
    });

    for (const c of adminCoupons) {
      const estimated = computeEstimatedDiscount(c, subtotal);
      const isApplicable = subtotal >= (c.minOrder || 0);
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
        const rawEstimated = computeEstimatedDiscount({ type: uc.type, discount: uc.discount }, subtotal);
        const estimated = capGameDiscount(rawEstimated);
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
        });
      }
    }

    // Sort by estimated discount descending
    results.sort((a, b) => b.estimatedDiscountAmount - a.estimatedDiscountAmount);

    return results;
  }

  /** List coupons available for a given subtotal. */
  async listAvailable(subtotal: number) {
    const now = new Date();
    const coupons = await Coupon.find({
      expiredDate: { $gt: now },
      $expr: { $or: [{ $eq: ['$quantity', 0] }, { $lt: ['$usedCount', '$quantity'] }] },
    }).sort({ createdAt: -1 });

    return coupons.map((c) => ({
      ...c.toObject(),
      isApplicable: subtotal >= (c.minOrder || 0),
      reason: subtotal < (c.minOrder || 0)
        ? `Đơn tối thiểu ${c.minOrder.toLocaleString('vi-VN')}đ`
        : undefined,
    }));
  }
}

export const couponService = new CouponService();
