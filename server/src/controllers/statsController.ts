import { Response } from 'express';
import { statsService } from '../services/statsService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';

export const statsController = {
  overview: asyncHandler(async (_req, res: Response) => {
    const data = await statsService.overview();
    return successResponse(res, data);
  }),

  revenueByDay: asyncHandler(async (req, res: Response) => {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
    const data = await statsService.revenueByDay(days);
    return successResponse(res, data);
  }),

  bestSelling: asyncHandler(async (req, res: Response) => {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 5));
    const data = await statsService.bestSelling(limit);
    return successResponse(res, data);
  }),

  ordersByStatus: asyncHandler(async (_req, res: Response) => {
    const data = await statsService.ordersByStatus();
    return successResponse(res, data);
  }),
};
