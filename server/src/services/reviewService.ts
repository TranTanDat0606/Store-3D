import { Types } from 'mongoose';
import { Review, Product, Order, OrderItem, OrderStatus, PaymentStatus } from '../models';
import { AppError } from '../utils/AppError';
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
    if (!review) throw new AppError('Không tìm thấy đánh giá', 404);
    return review;
  }

  /**
   * A user may review a product only after a qualifying purchase: they own an
   * order containing the product and that order is either fully paid or has
   * been delivered (completed).
   */
  private async findQualifyingOrder(userId: string, productId: string) {
    const orderItems = await OrderItem.find({ product: productId }).select('order');
    const orderIds = orderItems.map((oi) => oi.order);
    return Order.findOne({
      _id: { $in: orderIds },
      user: userId,
      $or: [
        { status: OrderStatus.Completed },
        { 'payment.status': PaymentStatus.Paid },
      ],
    });
  }

  /** Whether the current user may review a product (purchase check). */
  async getMyEligibility(userId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

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
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

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
    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) throw new AppError('Không tìm thấy đánh giá của bạn', 404);

    review.rating = data.rating ?? review.rating;
    review.comment = data.comment ?? review.comment;
    review.images = data.images ?? review.images;
    await review.save();

    await this.updateProductRating(String(review.product));
    return this.getById(String(review._id));
  }

  async remove(userId: string, reviewId: string) {
    const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });
    if (!review) throw new AppError('Không tìm thấy đánh giá của bạn', 404);
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
        .populate('product', 'name slug'),
      query,
      { ...options, sort: '-createdAt' },
    );
  }

  /** Admin: delete any review. */
  async adminRemove(reviewId: string) {
    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) throw new AppError('Không tìm thấy đánh giá', 404);
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
