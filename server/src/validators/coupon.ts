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

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã giảm giá'),
  subtotal: z.coerce.number().min(0),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
