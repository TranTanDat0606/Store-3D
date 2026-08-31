import { Schema, model, models, type Model } from 'mongoose';
import type { Types } from 'mongoose';

export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Shipping = 'shipping',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum PaymentMethod {
  Cash = 'cash',
  BankTransfer = 'bank-transfer',
}

export enum PaymentStatus {
  Unpaid = 'unpaid',
  PendingPayment = 'pending_payment',
  Paid = 'paid',
}

export interface IOrder {
  user: Types.ObjectId;
  items: Types.ObjectId[];
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  note?: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon?: {
    code: string;
    discount: number;
  };
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    orderCode?: string;
    qrExpiresAt?: Date;
  };
  paidAt?: Date;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người dùng là bắt buộc'],
    },
    items: {
      type: [Schema.Types.ObjectId],
      ref: 'OrderItem',
      default: [],
    },
    customer: {
      name: { type: String, required: [true, 'Tên khách hàng là bắt buộc'], trim: true },
      phone: { type: String, required: [true, 'Số điện thoại là bắt buộc'], trim: true },
      email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
      },
      address: { type: String, required: [true, 'Địa chỉ là bắt buộc'], trim: true },
    },
    note: { type: String, trim: true, default: '' },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    shipping: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0, default: 0 },
    coupon: {
      code: { type: String, trim: true, uppercase: true },
      discount: { type: Number, min: 0, default: 0 },
    },
    payment: {
      method: {
        type: String,
        enum: Object.values(PaymentMethod),
        default: PaymentMethod.Cash,
      },
      status: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.Unpaid,
      },
      orderCode: { type: String, trim: true, uppercase: true },
      qrExpiresAt: { type: Date },
    },
    paidAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.Pending,
    },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.orderCode': 1 }, { sparse: true, unique: true });

export const Order: Model<IOrder> = models.Order || model<IOrder>('Order', orderSchema);
