import { Response } from 'express';
import { userService } from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { UserRole } from '../models';
import { AppError } from '../utils/AppError';

export const userController = {
  list: asyncHandler(async (req, res: Response) => {
    const result = await userService.list(req.query as Record<string, unknown>);
    return successResponse(res, result.data, {
      pagination: result.pagination,
      meta: { adminCount: result.adminCount },
    });
  }),

  getById: asyncHandler(async (req, res: Response) => {
    const user = await userService.getById(req.params.id);
    return successResponse(res, user);
  }),

  updateRole: asyncHandler(async (req, res: Response) => {
    if (!Object.values(UserRole).includes(req.body.role)) {
      throw new AppError('Vai trò không hợp lệ', 400);
    }
    const user = await userService.updateRole(req.params.id, req.body.role);
    return successResponse(res, user, { message: 'Cập nhật vai trò thành công' });
  }),

  toggleActive: asyncHandler(async (req, res: Response) => {
    const user = await userService.toggleActive(req.params.id);
    return successResponse(res, user, { message: 'Cập nhật trạng thái thành công' });
  }),

  remove: asyncHandler(async (req, res: Response) => {
    await userService.remove(req.params.id);
    return successResponse(res, null, { message: 'Xóa người dùng thành công' });
  }),
};
