import { Response } from 'express';
import { rewardService } from '../services/rewardService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import type { AuthRequest } from '../middleware/auth';

export const rewardController = {
  startGame: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await rewardService.startGame(req.user!._id, req.body);
    return successResponse(res, result, { message: 'Bắt đầu trò chơi thành công' });
  }),

  completeGame: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await rewardService.completeGame(req.user!._id, req.body);
    const message = result.reward
      ? `Chúc mừng! Bạn nhận được mã giảm giá ${result.reward.discount}%`
      : 'Trò chơi đã kết thúc';
    return successResponse(res, result, { message });
  }),

  getMyCoupons: asyncHandler(async (req: AuthRequest, res: Response) => {
    const coupons = await rewardService.getMyCoupons(req.user!._id);
    return successResponse(res, coupons);
  }),
};
