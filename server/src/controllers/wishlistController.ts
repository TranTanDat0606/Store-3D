import { Response } from 'express';
import { wishlistService } from '../services/wishlistService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import type { AuthRequest } from '../middleware/auth';

export const wishlistController = {
  get: asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await wishlistService.get(req.user!._id);
    return successResponse(res, wishlist);
  }),

  add: asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await wishlistService.add(req.user!._id, req.body.productId);
    return successResponse(res, wishlist, { message: 'Đã thêm vào danh sách yêu thích' });
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await wishlistService.remove(req.user!._id, req.params.productId);
    return successResponse(res, wishlist, { message: 'Đã xóa khỏi danh sách yêu thích' });
  }),

  moveToCart: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await wishlistService.moveToCart(req.user!._id, req.body.productId);
    return successResponse(res, result, { message: 'Đã chuyển vào giỏ hàng' });
  }),
};
