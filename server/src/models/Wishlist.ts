import { Schema, model, models, type Model } from 'mongoose';
import type { Types } from 'mongoose';

export interface IWishlist {
  user: Types.ObjectId;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    products: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
  },
  { timestamps: true },
);

export const Wishlist: Model<IWishlist> = models.Wishlist || model<IWishlist>('Wishlist', wishlistSchema);
