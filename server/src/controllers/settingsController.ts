import { Response } from 'express';
import { settingsService } from '../services/settingsService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import type { AuthRequest } from '../middleware/auth';

export const settingsController = {
  /** Public business info — only configured, whitelisted keys. */
  getPublic: asyncHandler(async (_req, res: Response) => {
    const settings = await settingsService.getPublic();
    return successResponse(res, settings, { message: 'Lấy cài đặt công khai thành công' });
  }),

  /** Admin configuration write (requireAuth + requireAdmin in the route). */
  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const settings = await settingsService.update(req.body);
    return successResponse(res, settings, { message: 'Cập nhật cài đặt thành công' });
  }),
};
