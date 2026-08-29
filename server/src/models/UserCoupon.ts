import { Schema, model, models } from 'mongoose';
import type { Types } from 'mongoose';

export enum UserCouponSource {
  Game = 'game',
}

export interface IUserCoupon {
  user: Types.ObjectId;
  code: string;
  discount: number;
  type: 'percent';
  orderId: Types.ObjectId;
  source: UserCouponSource;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userCouponSchema = new Schema<IUserCoupon>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người dùng là bắt buộc'],
    },
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
      min: [1, 'Giá trị giảm tối thiểu 1'],
      max: [100, 'Giá trị giảm tối đa 100'],
    },
    type: {
      type: String,
      enum: ['percent'] as const,
      default: 'percent',
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Đơn hàng gốc là bắt buộc'],
    },
    source: {
      type: String,
      enum: Object.values(UserCouponSource),
      default: UserCouponSource.Game,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Ngày hết hạn là bắt buộc'],
    },
    usedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

userCouponSchema.index({ user: 1 });
userCouponSchema.index({ user: 1, usedAt: 1 });

export const UserCoupon =
  models.UserCoupon || model<IUserCoupon>('UserCoupon', userCouponSchema);
