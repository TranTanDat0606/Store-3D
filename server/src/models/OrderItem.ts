import { Schema, model, models } from 'mongoose';
import type { Types } from 'mongoose';

export interface IOrderItem {
  order: Types.ObjectId;
  product: Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

orderItemSchema.index({ order: 1 });

export const OrderItem = models.OrderItem || model<IOrderItem>('OrderItem', orderItemSchema);
