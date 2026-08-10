import { Types } from 'mongoose';
import { Review, Product } from '../models';
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

  async create(userId: string, data: { product: string; rating: number; comment: string; images: string[] }) {
    const product = await Product.findById(data.product);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

    const existing = await Review.findOne({ user: userId, product: data.product });
    if (existing) throw new AppError('Bạn đã đánh giá sản phẩm này', 409);

    const review = await Review.create({ ...data, user: userId });
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
