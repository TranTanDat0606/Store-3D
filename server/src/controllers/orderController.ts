import { Response } from 'express';
import { orderService } from '../services/orderService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { UserRole } from '../models';
import { AppError } from '../utils/AppError';
import type { AuthRequest } from '../middleware/auth';

export const orderController = {
  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await orderService.create(req.user!._id, req.body);
    return successResponse(res, order, { status: 201, message: 'Đặt hàng thành công' });
  }),

  /** Customer's own order history. */
  mine: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await orderService.listForUser(req.user!._id, req.query as Record<string, unknown>);
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  /** Order detail — customers can only view their own. */
  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await orderService.getById(req.params.id);
    const isAdmin = req.user!.role === UserRole.Admin;
    if (!isAdmin && String(order.user) !== req.user!._id) {
      throw new AppError('Không có quyền xem đơn hàng này', 403);
    }
    return successResponse(res, order);
  }),

  /** Admin: list all orders. */
  adminList: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await orderService.listAll(req.query as Record<string, unknown>);
    return successResponse(res, result.data, { pagination: result.pagination });
  }),

  /** Admin: update order status. */
  adminUpdateStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await orderService.updateStatus(req.params.id, req.body);
    return successResponse(res, order, { message: 'Cập nhật trạng thái đơn hàng thành công' });
  }),
};
