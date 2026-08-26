import { Schema, model, models } from 'mongoose';

export enum CouponType {
  Percent = 'percent',
  Fixed = 'fixed',
}

export interface ICoupon {
  code: string;
  discount: number;
  type: CouponType;
  expiredDate: Date;
  quantity: number;
  usedCount: number;
  minOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Mã giảm giá là bắt buộc'],
      uppercase: true,
      trim: true,
      unique: true,
    },
    discount: {
      type: Number,
      required: [true, 'Giá trị giảm là bắt buộc'],
      min: [0, 'Giá trị giảm không được âm'],
    },
    type: {
      type: String,
      enum: Object.values(CouponType),
      default: CouponType.Percent,
    },
    expiredDate: {
      type: Date,
      required: [true, 'Ngày hết hạn là bắt buộc'],
    },
    quantity: {
      type: Number,
      required: [true, 'Số lượng mã là bắt buộc'],
      min: [0, 'Số lượng không được âm'],
      default: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    minOrder: {
      type: Number,
      min: [0, 'Giá trị tối thiểu không được âm'],
      default: 0,
    },
  },
  { timestamps: true },
);

export const Coupon = models.Coupon || model<ICoupon>('Coupon', couponSchema);
