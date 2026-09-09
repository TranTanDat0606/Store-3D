import { randomBytes } from 'crypto';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../models';
import { AppError } from '../utils/AppError';
import { config } from '../config';
import { buildVietQrQuickLink, getBankName } from './vietQrService';
import { emailService } from './email/email.service';

export function generateOrderCode(): string {
  return `ST3D-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export interface ReconcileOrder {
  status: PaymentStatus | string;
  qrExpiresAt?: Date;
  total: number;
}

export type ReconcileResult =
  | { ok: true }
  | { ok: false; code: number; message: string };

export function validateReconcile(order: ReconcileOrder, amount: number, now: Date): ReconcileResult {
  if (order.status === PaymentStatus.Paid) return { ok: true };
  if (order.status !== PaymentStatus.PendingPayment) {
    return { ok: false, code: 409, message: 'Đơn hàng chưa tạo mã thanh toán' };
  }
  if (!order.qrExpiresAt || order.qrExpiresAt.getTime() <= now.getTime()) {
    return { ok: false, code: 400, message: 'Mã QR đã hết hạn' };
  }
  if (amount !== order.total) {
    return { ok: false, code: 400, message: 'Số tiền không khớp với đơn hàng' };
  }
  return { ok: true };
}

export class PaymentService {
  async createQrForOrder(userId: string, orderId: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
    if (String(order.user) !== userId) {
      throw new AppError('Không có quyền truy cập đơn hàng này', 403);
    }
    if (order.payment.method !== PaymentMethod.BankTransfer) {
      throw new AppError('Đơn hàng không dùng phương thức chuyển khoản', 400);
    }
    if (order.payment.status === PaymentStatus.Paid) {
      throw new AppError('Đơn hàng đã được thanh toán', 400);
    }
    if (!config.bank.accountNumber || !config.bank.accountName) {
      throw new AppError('Cấu hình tài khoản ngân hàng chưa được thiết lập', 500);
    }

    const now = new Date();
    const orderCode = order.payment.orderCode ?? generateOrderCode();
    const qrExpiresAt = new Date(now.getTime() + config.qrTtlMinutes * 60 * 1000);

    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          'payment.status': PaymentStatus.PendingPayment,
          'payment.orderCode': orderCode,
          'payment.qrExpiresAt': qrExpiresAt,
        },
      },
    );

    // Official VietQR Quick Link, rendered by the VietQR CDN from the trusted
    // server-side order data (amount + orderCode). No manual QR generation.
    const qrUrl = buildVietQrQuickLink({
      bin: config.bank.bin,
      accountNumber: config.bank.accountNumber,
      accountName: config.bank.accountName,
      amount: order.total,
      content: orderCode,
    });

    return {
      bank: {
        bin: config.bank.bin,
        accountNumber: config.bank.accountNumber,
        accountName: config.bank.accountName,
        accountDisplayName: config.bank.accountDisplayName,
        bankName: getBankName(config.bank.bin),
      },
      qrUrl,
      orderCode,
      amount: order.total,
      expiresAt: qrExpiresAt,
    };
  }

  async markOrderPaid(orderCode: string, amount: number) {
    const order = await Order.findOne({ 'payment.orderCode': orderCode });
    if (!order) throw new AppError('Không tìm thấy đơn hàng với mã chuyển khoản này', 404);

    const reconcileInput: ReconcileOrder = {
      status: order.payment.status,
      qrExpiresAt: order.payment.qrExpiresAt,
      total: order.total,
    };
    const result = validateReconcile(reconcileInput, amount, new Date());
    if (!result.ok) {
      throw new AppError(result.message, result.code);
    }
    if (order.payment.status === PaymentStatus.Paid) return order;

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, 'payment.status': { $ne: PaymentStatus.Paid } },
      {
        $set: {
          'payment.status': PaymentStatus.Paid,
          paidAt: new Date(),
          status: OrderStatus.Confirmed,
        },
      },
      { new: true },
    ).populate('items');

    // Send payment success email (fire-and-forget, don't block webhook response)
    if (updatedOrder) {
      const populatedItems = updatedOrder.items as unknown as Array<{
        product?: { name?: string };
        quantity: number;
        price: number;
      }>;
      emailService.sendPaymentSuccess({
        customerName: updatedOrder.customer.name,
        customerEmail: updatedOrder.customer.email,
        orderId: String(updatedOrder._id),
        orderCode: updatedOrder.payment.orderCode || String(updatedOrder._id).slice(-8).toUpperCase(),
        orderDate: new Date(updatedOrder.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        items: populatedItems.map((item) => ({
          name: (item.product as { name?: string })?.name ?? 'Sản phẩm',
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: updatedOrder.subtotal,
        discount: updatedOrder.discount,
        shipping: updatedOrder.shipping,
        total: updatedOrder.total,
        paymentMethod: updatedOrder.payment.method,
        paymentStatus: PaymentStatus.Paid,
        orderStatus: OrderStatus.Confirmed,
        address: updatedOrder.customer.address,
      }).catch((err) => { console.error('[Payment] sendPaymentSuccess fire-and-forget failed:', (err as Error).message); });
    }

    return updatedOrder;
  }
}

export const paymentService = new PaymentService();
