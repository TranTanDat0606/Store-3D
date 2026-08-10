import { Coupon, CouponType } from '../models';
import { AppError } from '../utils/AppError';
import type { CreateCouponInput, UpdateCouponInput, ApplyCouponInput } from '../validators/coupon';

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
  async apply(data: ApplyCouponInput) {
    const coupon = await Coupon.findOne({ code: data.code.toUpperCase().trim() });
    if (!coupon) throw new AppError('Mã giảm giá không tồn tại', 400);
    if (coupon.quantity <= coupon.usedCount) throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
    if (coupon.expiredDate < new Date()) throw new AppError('Mã giảm giá đã hết hạn', 400);

    let discount = 0;
    if (coupon.type === CouponType.Percent) {
      discount = Math.round((data.subtotal * coupon.discount) / 100);
    } else {
      discount = Math.min(coupon.discount, data.subtotal);
    }

    return { coupon, discount };
  }
}

export const couponService = new CouponService();
