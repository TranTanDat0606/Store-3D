import { Response } from 'express';
import { reviewService } from '../services/reviewService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import type { AuthRequest } from '../middleware/auth';

export const reviewController = {
  /** Public: reviews for a product. */
  listByProduct: asyncHandler(async (req, res: Response) => {
    const result = await reviewService.listByProduct(req.params.productId, req.query as Record<string, unknown>);
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const review = await reviewService.create(req.user!._id, req.body);
    return successResponse(res, review, { status: 201, message: 'Gửi đánh giá thành công' });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const review = await reviewService.update(req.user!._id, req.params.id, req.body);
    return successResponse(res, review, { message: 'Cập nhật đánh giá thành công' });
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await reviewService.remove(req.user!._id, req.params.id);
    return successResponse(res, null, { message: 'Xóa đánh giá thành công' });
  }),

  /** Admin: list all reviews. */
  listAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await reviewService.listAll(req.query as Record<string, unknown>);
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  /** Admin: delete any review. */
  adminRemove: asyncHandler(async (req: AuthRequest, res: Response) => {
    await reviewService.adminRemove(req.params.id);
    return successResponse(res, null, { message: 'Xóa đánh giá thành công' });
  }),
};
