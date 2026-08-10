import { Schema, model, models } from 'mongoose';
import type { Types } from 'mongoose';

export interface IReview {
  user: Types.ObjectId;
  product: Types.ObjectId;
  order?: Types.ObjectId;
  rating: number;
  comment: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người đánh giá là bắt buộc'],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Sản phẩm là bắt buộc'],
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'Số sao là bắt buộc'],
      min: [1, 'Đánh giá tối thiểu 1 sao'],
      max: [5, 'Đánh giá tối đa 5 sao'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Bình luận tối đa 1000 ký tự'],
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const Review = models.Review || model<IReview>('Review', reviewSchema);
