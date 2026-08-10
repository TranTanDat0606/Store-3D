import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '../models';

const phoneRegex = /^[0-9+\-\s]{8,15}$/;

export const orderItemSchema = z.object({
  product: z.string().min(1, 'Sản phẩm là bắt buộc'),
  quantity: z.coerce.number().int().min(1, 'Số lượng tối thiểu 1'),
});

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, 'Tên khách hàng tối thiểu 2 ký tự').max(100),
    phone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ'),
    email: z.string().email('Email không hợp lệ').max(100),
    address: z.string().trim().min(5, 'Địa chỉ tối thiểu 5 ký tự').max(500),
  }),
  items: z.array(orderItemSchema).min(1, 'Giỏ hàng trống'),
  note: z.string().trim().max(1000, 'Ghi chú tối đa 1000 ký tự').optional().default(''),
  paymentMethod: z.enum([PaymentMethod.Cash, PaymentMethod.BankTransfer]).optional(),
  couponCode: z.string().trim().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(Object.values(OrderStatus) as [string, ...string[]]),
  paymentStatus: z.enum(['unpaid', 'paid']).optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
