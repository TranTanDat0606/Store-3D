import { Types } from 'mongoose';
import { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus, Coupon, CouponType, Product, UserCoupon } from '../models';
import { AppError } from '../utils/AppError';
import { apiFeatures, parsePagination } from '../utils/apiFeatures';
import type { CreateOrderInput, UpdateOrderStatusInput } from '../validators/order';

interface CouponApplication {
  code: string;
  discount: number;
  isAdminCoupon: boolean;
}

/**
 * One-way order workflow. Admin may only move an order forward along the
 * linear chain: pending → confirmed → shipping → completed.
 * A pending order may additionally be cancelled. Backward/skipped
 * transitions are rejected on the backend (not just in the UI).
 */
export const ALLOWED_NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Shipping, OrderStatus.Cancelled],
  [OrderStatus.Shipping]: [OrderStatus.Completed],
  [OrderStatus.Completed]: [],
  [OrderStatus.Cancelled]: [],
};

/** Validates a coupon code against the subtotal. Returns null when no coupon given. */
async function resolveCoupon(code: string | undefined, subtotal: number, userId?: string): Promise<CouponApplication | null> {
  if (!code) return null;

  const normalizedCode = code.toUpperCase().trim();

  // Try admin Coupon first
  const coupon = await Coupon.findOne({ code: normalizedCode });
  if (coupon) {
    if (coupon.quantity <= coupon.usedCount) throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
    if (coupon.expiredDate < new Date()) throw new AppError('Mã giảm giá đã hết hạn', 400);

    let discount = 0;
    if (coupon.type === CouponType.Percent) {
      discount = Math.round((subtotal * coupon.discount) / 100);
    } else {
      discount = Math.min(coupon.discount, subtotal);
    }

    return { code: coupon.code, discount, isAdminCoupon: true };
  }

  // Fallback: check per-user reward coupons (atomic redemption)
  if (userId) {
    const userCoupon = await UserCoupon.findOneAndUpdate(
      { code: normalizedCode, user: userId, usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { new: true },
    );
    if (userCoupon) {
      const discount = Math.round((subtotal * userCoupon.discount) / 100);
      return { code: userCoupon.code, discount, isAdminCoupon: false };
    }
  }

  throw new AppError('Mã giảm giá không tồn tại', 400);
}

export class OrderService {
  async create(userId: string, data: CreateOrderInput) {
    const productIds = data.items.map((i) => i.product);

    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      throw new AppError('Có sản phẩm không tồn tại trong giỏ hàng', 400);
    }

    const productMap = new Map(products.map((p) => [String(p._id), p]));

    // Validate stock and calculate line totals
    const lineTotals: { productId: string; price: number; quantity: number; name: string; image: string }[] = [];
    let subtotal = 0;

    for (const item of data.items) {
      const product = productMap.get(item.product);
      if (!product) throw new AppError('Sản phẩm không tồn tại', 400);
      if (product.stock < item.quantity) {
        throw new AppError(`Sản phẩm "${product.name}" không đủ hàng`, 400);
      }
      const price = product.salePrice;
      subtotal += price * item.quantity;
      lineTotals.push({
        productId: String(product._id),
        price,
        quantity: item.quantity,
        name: product.name,
        image: product.images[0] ?? '',
      });
    }

    const coupon = await resolveCoupon(data.couponCode, subtotal, userId);
    const shipping = 0; // free shipping
    const total = subtotal - (coupon?.discount ?? 0) + shipping;

    // Note: sequential writes (no DB transaction) — MongoDB Community standalone
    // does not support multi-document transactions (needs a replica set).
    const order = await Order.create({
      user: new Types.ObjectId(userId),
      customer: data.customer,
      note: data.note || '',
      subtotal,
      discount: coupon?.discount ?? 0,
      shipping,
      total,
      coupon: coupon ? { code: coupon.code, discount: coupon.discount } : undefined,
      payment: {
        method: data.paymentMethod || PaymentMethod.Cash,
        status: PaymentStatus.Unpaid,
      },
      status: OrderStatus.Pending,
    });

    const orderItems = await OrderItem.create(
      lineTotals.map((lt) => ({
        order: order._id,
        product: new Types.ObjectId(lt.productId),
        name: lt.name,
        image: lt.image,
        price: lt.price,
        quantity: lt.quantity,
      })),
    );

    await Order.updateOne(
      { _id: order._id },
      { $set: { items: orderItems.map((oi) => oi._id) } },
    );

    // Decrement stock atomically (guards against overselling under concurrency).
    for (const lt of lineTotals) {
      const updated = await Product.findOneAndUpdate(
        { _id: lt.productId, stock: { $gte: lt.quantity } },
        { $inc: { stock: -lt.quantity } },
        { new: true },
      );
      if (!updated) {
        await OrderItem.deleteMany({ order: order._id });
        await Order.findByIdAndDelete(order._id);
        throw new AppError(`Sản phẩm "${lt.name}" không đủ hàng`, 400);
      }
    }

    // Increment admin coupon usage (UserCoupons are already atomically marked via findOneAndUpdate)
    if (coupon?.isAdminCoupon) {
      await Coupon.updateOne(
        { code: coupon.code },
        { $inc: { usedCount: 1 } },
      );
    }

    return this.getById(String(order._id));
  }

  /** Customer's own orders. */
  async listForUser(userId: string, params: Record<string, unknown>) {
    const options = parsePagination(params);
    const filter = { user: new Types.ObjectId(userId) };
    return apiFeatures(
      Order.find()
        .populate('items')
        .populate({ path: 'items', populate: { path: 'product', select: 'name slug images salePrice' } }),
      filter,
      options,
    );
  }

  /** Admin: all orders with search/filter. */
  async listAll(params: Record<string, unknown>) {
    const options = parsePagination(params);

    const filter: Record<string, unknown> = {};
    const { status, from, to } = params;
    if (status) filter.status = status;
    if (from || to) {
      filter.createdAt = {
        ...(from ? { $gte: new Date(String(from)) } : {}),
        ...(to ? { $lte: new Date(String(to)) } : {}),
      };
    }

    const searchTerm = options.search?.replace(/^#/, '').trim();
    if (searchTerm) {
      filter.$or = [
        { 'customer.name': { $regex: searchTerm, $options: 'i' } },
        { 'customer.phone': { $regex: searchTerm, $options: 'i' } },
        { 'customer.email': { $regex: searchTerm, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: { $toLower: { $toString: '$_id' } },
              regex: searchTerm.toLowerCase(),
            },
          },
        },
      ];
    }

    return apiFeatures(
      Order.find().populate('items'),
      filter,
      options,
    );
  }

  async getById(id: string) {
    const order = await Order.findById(id).populate('items').populate({
      path: 'items',
      populate: { path: 'product', select: 'name slug images salePrice' },
    });
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
    return order;
  }

  async updateStatus(id: string, data: UpdateOrderStatusInput) {
    const order = await Order.findById(id);
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);

    // One-way workflow: only the next valid status is allowed. Same-status
    // no-op updates are permitted (e.g. admin only marking a payment).
    if (data.status !== order.status) {
      const allowed = ALLOWED_NEXT_STATUS[order.status as OrderStatus] ?? [];
      if (!allowed.includes(data.status as OrderStatus)) {
        throw new AppError('Không thể chuyển trạng thái đơn hàng ngược hoặc bỏ qua các bước', 400);
      }
    }

    // Restore stock when an order is cancelled (only pending orders can be
    // cancelled, and they had their stock decremented at creation time).
    if (data.status === OrderStatus.Cancelled && order.status !== OrderStatus.Cancelled) {
      const items = await OrderItem.find({ order: order._id }).select('product quantity');
      if (items.length > 0) {
        await Product.bulkWrite(
          items.map((item) => ({
            updateOne: {
              filter: { _id: item.product },
              update: { $inc: { stock: item.quantity } },
            },
          })),
        );
      }
    }

    const updates: Record<string, unknown> = { status: data.status };
    if (data.paymentStatus) {
      updates['payment.status'] = data.paymentStatus;
      if (data.paymentStatus === PaymentStatus.Paid && !order.paidAt) {
        updates.paidAt = new Date();
      }
    }

    // Completing an order means the revenue is realized: mark it paid even
    // for COD (which has no bank reconcile step). Cash completed orders were
    // previously stuck on 'unpaid' and never appeared in revenue stats.
    if (data.status === OrderStatus.Completed && order.payment?.status !== PaymentStatus.Paid) {
      updates['payment.status'] = PaymentStatus.Paid;
      if (!order.paidAt) {
        updates.paidAt = new Date();
      }
    }

    const updated = await Order.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('items')
      .populate({ path: 'items', populate: { path: 'product', select: 'name slug images salePrice' } });
    return updated;
  }

  /** Customer: cancel their own order (pending or confirmed only). */
  async cancelByUser(userId: string, orderId: string, reason?: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
    if (String(order.user) !== userId) throw new AppError('Không có quyền hủy đơn hàng này', 403);

    const cancellableStatuses: OrderStatus[] = [OrderStatus.Pending, OrderStatus.Confirmed];
    if (!cancellableStatuses.includes(order.status as OrderStatus)) {
      throw new AppError('Không thể hủy đơn hàng ở trạng thái này', 400);
    }

    // Restore stock
    const items = await OrderItem.find({ order: order._id }).select('product quantity');
    if (items.length > 0) {
      await Product.bulkWrite(
        items.map((item) => ({
          updateOne: {
            filter: { _id: item.product },
            update: { $inc: { stock: item.quantity } },
          },
        })),
      );
    }

    // Restore coupon usage
    if (order.coupon?.code) {
      if (order.coupon.code.startsWith('REWARD-')) {
        // Restore UserCoupon: clear usedAt
        await UserCoupon.updateOne(
          { code: order.coupon.code, user: userId },
          { $unset: { usedAt: '' } },
        );
      } else {
        // Restore admin Coupon usage count
        await Coupon.updateOne(
          { code: order.coupon.code },
          { $inc: { usedCount: -1 } },
        );
      }
    }

    const updates: Record<string, unknown> = { status: OrderStatus.Cancelled };
    if (reason) updates['note'] = (order.note ? order.note + '\n' : '') + `Lý do hủy: ${reason}`;

    const updated = await Order.findByIdAndUpdate(orderId, { $set: updates }, { new: true })
      .populate('items')
      .populate({ path: 'items', populate: { path: 'product', select: 'name slug images salePrice' } });
    return updated;
  }
}

export const orderService = new OrderService();
