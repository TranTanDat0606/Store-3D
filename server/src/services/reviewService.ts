import { Types } from 'mongoose';
import { Review, Product, Order, OrderItem, OrderStatus } from '../models';
import { AppError, assertOwnership, resourceNotFound } from '../utils/AppError';
import { apiFeatures, parsePagination } from '../utils/apiFeatures';

export class ReviewService {
  /** Reviews for a product (public). */
  async listByProduct(productId: string, params: Record<string, unknown>) {
    const options = parsePagination(params);
    return apiFeatures(
      Review.find({ product: productId }).populate('user', 'fullname avatar'),
      { product: productId },
      { ...options, sort: '-createdAt' },
    );
  }

  async getById(id: string) {
    const review = await Review.findById(id).populate('user', 'fullname avatar');
    if (!review) throw resourceNotFound('review');
    return review;
  }

  /**
   * A user may review a product only after the order has been delivered
   * (status = completed). Pending, confirmed, shipping, or cancelled
   * orders do not qualify.
   */
  private async findQualifyingOrder(userId: string, productId: string) {
    const orderItems = await OrderItem.find({ product: productId }).select('order');
    const orderIds = orderItems.map((oi) => oi.order);
    return Order.findOne({
      _id: { $in: orderIds },
      user: userId,
      status: OrderStatus.Completed,
    });
  }

  /** Whether the current user may review a product (purchase check). */
  async getMyEligibility(userId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product) throw resourceNotFound('product');

    const [purchased, existing] = await Promise.all([
      this.findQualifyingOrder(userId, productId),
      Review.findOne({ user: userId, product: productId }),
    ]);

    return {
      product: productId,
      purchased: Boolean(purchased),
      hasReviewed: Boolean(existing),
      canReview: Boolean(purchased) && !existing,
      review: existing,
    };
  }

  async create(userId: string, data: { product: string; rating: number; comment: string; images: string[] }) {
    const product = await Product.findById(data.product);
    if (!product) throw resourceNotFound('product');

    const existing = await Review.findOne({ user: userId, product: data.product });
    if (existing) throw new AppError('Bạn đã đánh giá sản phẩm này', 409);

    // Only customers who actually bought (and received) the product may review it.
    const qualifyingOrder = await this.findQualifyingOrder(userId, data.product);
    if (!qualifyingOrder) {
      throw new AppError('Bạn cần mua và nhận được sản phẩm này trước khi đánh giá', 403);
    }

    const review = await Review.create({ ...data, user: userId, order: qualifyingOrder._id });
    await this.updateProductRating(data.product);
    return this.getById(String(review._id));
  }

  async update(userId: string, reviewId: string, data: { rating?: number; comment?: string; images?: string[] }) {
    const review = await Review.findById(reviewId);
    // GAP-13: genuinely missing → 404; someone else's review → 403.
    if (!review) throw resourceNotFound('review');
    assertOwnership(review.user, userId);

    review.rating = data.rating ?? review.rating;
    review.comment = data.comment ?? review.comment;
    review.images = data.images ?? review.images;
    await review.save();

    await this.updateProductRating(String(review.product));
    return this.getById(String(review._id));
  }

  async remove(userId: string, reviewId: string) {
    const review = await Review.findById(reviewId);
    // GAP-13: ownership is checked BEFORE the delete — a foreign review is
    // rejected with 403 and never removed by the probe.
    if (!review) throw resourceNotFound('review');
    assertOwnership(review.user, userId);
    await Review.deleteOne({ _id: reviewId });
    await this.updateProductRating(String(review.product));
    return review;
  }

  /** Admin: list all reviews with pagination. */
  async listAll(params: Record<string, unknown>) {
    const options = parsePagination(params);
    const query: Record<string, unknown> = {};
    if (params.search) {
      query['$or'] = [
        { comment: { $regex: String(params.search), $options: 'i' } },
      ];
    }
    return apiFeatures(
      Review.find(query)
        .populate('user', 'fullname avatar')
        .populate('product', 'name slug images'),
      query,
      { ...options, sort: '-createdAt' },
    );
  }

  /** Admin: delete any review. */
  async adminRemove(reviewId: string) {
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) throw resourceNotFound('review');
    await this.updateProductRating(String(review.product));
    return review;
  }

  private async updateProductRating(productId: string) {
    const result = await Review.aggregate([
      { $match: { product: new Types.ObjectId(productId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const stats = result[0];
    const newRating = stats ? Math.round(stats.avg * 10) / 10 : 0;
    const reviewCount = stats?.count ?? 0;
    await Product.updateOne({ _id: productId }, { rating: newRating, reviewCount });
  }
}

export const reviewService = new ReviewService();
