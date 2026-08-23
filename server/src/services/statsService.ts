import { Order, OrderItem, Product, User, UserRole, OrderStatus, PaymentStatus } from '../models';

interface DailyRevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export class StatsService {
  /** Overview cards: total revenue, orders, products, customers. */
  async overview() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidNotCancelled = { 'payment.status': PaymentStatus.Paid, status: { $ne: OrderStatus.Cancelled } };

    const [
      revenueResult,
      totalOrders,
      totalProducts,
      totalCustomers,
      pendingOrders,
      completedOrders,
      todayRevenueResult,
      monthRevenueResult,
    ] = await Promise.all([
      Order.aggregate([{ $match: paidNotCancelled }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: UserRole.Customer }),
      Order.countDocuments({ status: OrderStatus.Pending }),
      Order.countDocuments({ status: OrderStatus.Completed }),
      Order.aggregate([
        { $match: paidNotCancelled },
        { $addFields: { revenueDate: { $ifNull: ['$paidAt', '$updatedAt'] } } },
        { $match: { revenueDate: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: paidNotCancelled },
        { $addFields: { revenueDate: { $ifNull: ['$paidAt', '$updatedAt'] } } },
        { $match: { revenueDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    return {
      totalRevenue: revenueResult[0]?.total ?? 0,
      todayRevenue: todayRevenueResult[0]?.total ?? 0,
      monthRevenue: monthRevenueResult[0]?.total ?? 0,
      totalOrders,
      totalProducts,
      totalCustomers,
      pendingOrders,
      completedOrders,
    };
  }

  /** Revenue + order count per day for the last N days. */
  async revenueByDay(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const rows = await Order.aggregate([
      {
        $match: {
          'payment.status': PaymentStatus.Paid,
          status: { $ne: OrderStatus.Cancelled },
        },
      },
      { $addFields: { revenueDate: { $ifNull: ['$paidAt', '$updatedAt'] } } },
      { $match: { revenueDate: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$revenueDate' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days with zeroes
    const map = new Map(rows.map((r) => [r._id, r]));
    const points: DailyRevenuePoint[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      points.push({
        date: key,
        revenue: map.get(key)?.revenue ?? 0,
        orders: map.get(key)?.orders ?? 0,
      });
    }
    return points;
  }

  /** Revenue + order count for a relative period: day / week / month / year. */
  async revenueByPeriod(period: 'day' | 'week' | 'month' | 'year') {
    const now = new Date();
    let from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === 'week') {
      from.setDate(from.getDate() - ((from.getDay() + 6) % 7)); // Monday of current week
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'year') {
      from = new Date(now.getFullYear(), 0, 1);
    }

    const rows = await Order.aggregate([
      {
        $match: {
          'payment.status': PaymentStatus.Paid,
          status: { $ne: OrderStatus.Cancelled },
        },
      },
      { $addFields: { revenueDate: { $ifNull: ['$paidAt', '$updatedAt'] } } },
      { $match: { revenueDate: { $gte: from } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]);

    return {
      period,
      from: from.toISOString(),
      to: now.toISOString(),
      revenue: rows[0]?.revenue ?? 0,
      orders: rows[0]?.orders ?? 0,
    };
  }

  /** Top selling products by quantity sold. */
  async bestSelling(limit = 5) {
    const rows = await OrderItem.aggregate([
      {
        $group: {
          _id: '$product',
          totalSold: { $sum: '$quantity' },
          revenue: { $sum: { $multiply: ['$price', '$quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          name: '$product.name',
          slug: '$product.slug',
          image: { $arrayElemAt: ['$product.images', 0] },
          totalSold: 1,
          revenue: 1,
        },
      },
    ]);
    return rows;
  }

  /** Orders per status (for a status breakdown chart). */
  async ordersByStatus() {
    const rows = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return rows.map((r) => ({ status: r._id, count: r.count }));
  }
}

export const statsService = new StatsService();
