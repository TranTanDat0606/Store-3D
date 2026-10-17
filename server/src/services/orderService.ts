import { Types } from 'mongoose';
import { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus, Coupon, Product, UserCoupon, Address } from '../models';
import { AppError } from '../utils/AppError';
import { apiFeatures, parsePagination } from '../utils/apiFeatures';
import { assertItemsActive } from './productQuery';
import { computeDiscount } from './discountMath';
import { compensationPlanFor, runCompensation } from './orderCreation';
import type { CompensationAction, CompensationContext, OrderCreationStep } from './orderCreation';
import type { CreateOrderInput, UpdateOrderStatusInput } from '../validators/order';

interface CouponApplication {
  code: string;
  discount: number;
  isAdminCoupon: boolean;
  /** For reward (game) coupons: the UserCoupon to atomically claim after validation. */
  userCouponId?: unknown;
}

export type CouponReleaseAction =
  | { kind: 'coupon-restore'; id: unknown }
  | { kind: 'usercoupon-release'; id: unknown };

/**
 * Pure seam (GAP-3): classify which coupon-usage side effects a cancelled order
 * must undo. System percent/fixed coupons are restored via `Coupon.usedCount`;
 * game reward coupons are released by clearing `UserCoupon.usedAt`. Returns an
 * empty list when the order carried no coupon. Consumed by the cancel branches
 * (via executeCouponRelease) and later by Task 4's compensation planner.
 */
export function releaseOrderCoupon(order: {
  coupon?: unknown;
  userCoupon?: unknown;
}): CouponReleaseAction[] {
  const actions: CouponReleaseAction[] = [];
  if (order.coupon != null) actions.push({ kind: 'coupon-restore', id: order.coupon });
  if (order.userCoupon != null) actions.push({ kind: 'usercoupon-release', id: order.userCoupon });
  return actions;
}

/**
 * Pure seam (GAP-5): the ordered steps for redeeming a coupon against a payment.
 * The bank-transfer minimum (`validate-minimum`) is emitted BEFORE any `mark-used`
 * step, and is the only step when the minimum would fail — so a reward coupon is
 * never burned on an order that the payment threshold rejects. Cash orders skip the
 * threshold and mark immediately.
 */
export function redemptionPlan(
  coupon: unknown | null,
  payment: { method: 'cash' | 'bank-transfer'; totalVnd: number },
): Array<'validate-minimum' | 'mark-used'> {
  const plan: Array<'validate-minimum' | 'mark-used'> = [];
  if (payment.method === 'bank-transfer') {
    plan.push('validate-minimum');
    if (payment.totalVnd < 1000) return plan; // threshold fails → never mark
  }
  if (coupon) plan.push('mark-used');
  return plan;
}

/**
 * The ONE DB implementation backing `releaseOrderCoupon`, shared by cancelByUser
 * and the admin-cancel branch of updateStatus (GAP-3). Classifies the order's
 * coupon code (game reward codes are `REWARD-` prefixed) and undoes its usage.
 */
async function executeCouponRelease(
  order: { coupon?: { code?: string } | null; user?: unknown },
  userId?: string,
): Promise<void> {
  const code = order.coupon?.code;
  if (!code) return;
  const isReward = code.startsWith('REWARD-');
  const actions = releaseOrderCoupon(isReward ? { userCoupon: code } : { coupon: code });
  const owner = userId ?? order.user;
  for (const action of actions) {
    if (action.kind === 'coupon-restore') {
      await Coupon.updateOne({ code: action.id }, { $inc: { usedCount: -1 } });
    } else {
      await UserCoupon.updateOne({ code: action.id, user: owner }, { $unset: { usedAt: '' } });
    }
  }
}

/**
 * DB executor for one GAP-4 compensation action (called best-effort from
 * create()'s catch; errors are logged by runCompensation, never rethrown —
 * the ORIGINAL creation error is always what propagates).
 * Carry-over (a): a usercoupon-release targets the UserCoupon by `_id` when
 * the action carries the document id (create() knows it from the claim);
 * only falls back to (code, user) when it doesn't.
 */
async function executeCompensation(action: CompensationAction, userId: string): Promise<void> {
  switch (action.kind) {
    case 'release-coupon': {
      for (const ca of action.payload as CouponReleaseAction[]) {
        if (ca.kind === 'coupon-restore') {
          await Coupon.updateOne({ code: ca.id }, { $inc: { usedCount: -1 } });
        } else {
          const isId = Types.ObjectId.isValid(ca.id as string);
          await UserCoupon.updateOne(
            isId ? { _id: ca.id } : { code: ca.id, user: userId },
            { $unset: { usedAt: '' } },
          );
        }
      }
      break;
    }
    case 'restore-stock': {
      const items = action.payload as Array<{ product: unknown; quantity: number }>;
      if (items.length > 0) {
        await Product.bulkWrite(
          items.map((i) => ({
            updateOne: { filter: { _id: i.product }, update: { $inc: { stock: i.quantity } } },
          })),
        );
      }
      break;
    }
    case 'delete-items':
      await OrderItem.deleteMany({ order: action.payload });
      break;
    case 'delete-order':
      await Order.findByIdAndDelete(action.payload);
      break;
  }
}

/**
 * One-way order workflow. Admin may only move an order forward along the
 * linear chain: pending → confirmed → shipping → completed.
 * A pending order may additionally be cancelled. Backward/skipped
 * transitions are rejected on the backend (not just in the UI).
 * Customer may only cancel pending orders; admin may cancel pending or confirmed.
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

    // Single-source discount math — identical to the coupon preview path.
    const { discountVnd: discount } = computeDiscount(
      { type: coupon.type, value: coupon.discount, minOrder: coupon.minOrder, source: 'admin' },
      subtotal,
    );

    return { code: coupon.code, discount, isAdminCoupon: true };
  }

  // Fallback: peek at per-user reward coupons (GAP-5 — do NOT mark usedAt here;
  // the claim happens after the bank-transfer threshold validates).
  if (userId) {
    const userCoupon = await UserCoupon.findOne({
      code: normalizedCode,
      user: userId,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (userCoupon) {
      // Game reward coupons are capped at MAX_DISCOUNT_VND at order time (GAP-2).
      const { discountVnd: discount } = computeDiscount(
        { type: userCoupon.type, value: userCoupon.discount, minOrder: 0, source: 'game' },
        subtotal,
      );
      return { code: userCoupon.code, discount, isAdminCoupon: false, userCouponId: userCoupon._id };
    }
  }

  throw new AppError('Mã giảm giá không tồn tại', 400);
}

export class OrderService {
  async create(userId: string, data: CreateOrderInput) {
    // Validate address ownership if addressId is provided
    if (data.customer.addressId) {
      const address = await Address.findOne({ _id: data.customer.addressId, userId });
      if (!address) {
        throw new AppError('Địa chỉ không hợp lệ hoặc không thuộc về bạn', 400);
      }
      // Use the address from the Address model as source of truth
      data.customer.address = [address.street, address.ward, address.district, address.province].filter(Boolean).join(', ');
      data.customer.name = address.recipientName;
      data.customer.phone = address.phone;
    }

    const productIds = data.items.map((i) => i.product);

    const products = await Product.find({ _id: { $in: productIds } });
    // GAP-1: requested ids must exist (404) and every product must still be sellable (400).
    assertItemsActive(products, data.items);

    const productMap = new Map(products.map((p) => [String(p._id), p]));

    // authoritative: prices from DB, never from request/preview
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
    const paymentMethod = data.paymentMethod || PaymentMethod.Cash;

    // GAP-5: validation strictly precedes marking — a reward coupon is never
    // burned on an order the bank-transfer threshold rejects.
    const plan = redemptionPlan(coupon, {
      method: paymentMethod === PaymentMethod.BankTransfer ? 'bank-transfer' : 'cash',
      totalVnd: total,
    });
    // GAP-4: context for the compensating rollback. couponActions carries the
    // document `_id` for a claimed reward coupon (executor targets `_id`).
    const ctx: CompensationContext = { orderId: null, items: [], couponActions: [] };
    for (const redemptionStep of plan) {
      if (redemptionStep === 'validate-minimum') {
        // Payment threshold: bank-transfer requires total >= 1000 VND
        if (paymentMethod === PaymentMethod.BankTransfer && total < 1000) {
          throw new AppError('Đơn hàng dưới 1.000đ không hỗ trợ thanh toán chuyển khoản. Vui lòng chọn phương thức khác.', 400);
        }
      } else if (redemptionStep === 'mark-used') {
        // Claim the reward coupon atomically (guards against concurrent redemption).
        if (coupon && !coupon.isAdminCoupon) {
          const claimed = await UserCoupon.findOneAndUpdate(
            { _id: coupon.userCouponId, usedAt: null },
            { $set: { usedAt: new Date() } },
            { new: true },
          );
          if (!claimed) throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
          ctx.couponActions.push(...releaseOrderCoupon({ userCoupon: coupon.userCouponId }));
        }
      }
    }

    // Note: sequential writes (no DB transaction) — MongoDB Community standalone
    // does not support multi-document transactions (needs a replica set).
    // GAP-4: each step is tagged; on failure the planner inverts everything
    // persisted so far (best-effort, logged — the original error always wins).
    let step: OrderCreationStep = 'order-created';
    try {
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
          method: paymentMethod,
          status: PaymentStatus.Unpaid,
        },
        status: OrderStatus.Pending,
      });
      ctx.orderId = order._id;

      step = 'items-created';
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
      // Each applied decrement lands in ctx.items so a partial failure restores
      // exactly what was applied (GAP-4 compensates; no inline rollback).
      step = 'stock-updated';
      for (const lt of lineTotals) {
        const updated = await Product.findOneAndUpdate(
          { _id: lt.productId, stock: { $gte: lt.quantity } },
          { $inc: { stock: -lt.quantity } },
          { new: true },
        );
        if (!updated) {
          throw new AppError(`Sản phẩm "${lt.name}" không đủ hàng`, 400);
        }
        ctx.items.push({ product: lt.productId, quantity: lt.quantity });
      }

      // Increment admin coupon usage (UserCoupons are already claimed via redemptionPlan)
      step = 'coupon-marked';
      if (coupon?.isAdminCoupon) {
        await Coupon.updateOne(
          { code: coupon.code },
          { $inc: { usedCount: 1 } },
        );
        ctx.couponActions.push(...releaseOrderCoupon({ coupon: coupon.code }));
      }

      step = 'done';
      return await this.getById(String(order._id));
    } catch (err) {
      // GAP-4: compensating rollback for order creation. Runs the inverse
      // actions for everything persisted up to the failed step — best-effort:
      // a failing compensation action is logged and its siblings still run.
      // The ORIGINAL error is always rethrown (runCompensation never throws).
      await runCompensation(
        compensationPlanFor(step, ctx),
        (action) => executeCompensation(action, userId),
        (compErr, action) => console.error(`[order-compensation] ${action.kind} failed:`, compErr),
      );
      throw err;
    }
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
      // GAP-3: admin cancel restores coupon usage too — same implementation as
      // cancelByUser (executeCouponRelease → releaseOrderCoupon).
      await executeCouponRelease(order);
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

  /** Customer: cancel their own order (pending only). */
  async cancelByUser(userId: string, orderId: string, reason?: string) {
    // Atomic conditional update: only cancel if status is still pending and
    // belongs to this user. This prevents race conditions where admin
    // confirms the order at the same time user tries to cancel.
    const updated = await Order.findOneAndUpdate(
      {
        _id: orderId,
        user: userId,
        status: OrderStatus.Pending,
      },
      { $set: { status: OrderStatus.Cancelled } },
      { new: true },
    );

    if (!updated) {
      // Distinguish between not-found and wrong-status
      const order = await Order.findById(orderId);
      if (!order) throw new AppError('Không tìm thấy đơn hàng', 404);
      if (String(order.user) !== userId) throw new AppError('Không có quyền hủy đơn hàng này', 403);
      throw new AppError('Không thể hủy đơn hàng ở trạng thái này', 400);
    }

    // Restore stock
    const items = await OrderItem.find({ order: updated._id }).select('product quantity');
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

    // Restore coupon usage (GAP-3: shared implementation with the admin-cancel
    // branch — executeCouponRelease → releaseOrderCoupon).
    await executeCouponRelease(updated, userId);

    // Append cancel reason to note if provided
    if (reason) {
      const noteSuffix = `Lý do hủy: ${reason}`;
      await Order.findByIdAndUpdate(orderId, {
        $set: { note: updated.note ? updated.note + '\n' + noteSuffix : noteSuffix },
      });
    }

    return updated
      .populate('items')
      .then((doc) => doc?.populate({ path: 'items', populate: { path: 'product', select: 'name slug images salePrice' } }));
  }
}

export const orderService = new OrderService();
