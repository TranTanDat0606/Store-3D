import { Response } from 'express';
import { couponService } from '../services/couponService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';

export const couponController = {
  list: asyncHandler(async (_req, res: Response) => {
    const coupons = await couponService.list();
    return successResponse(res, coupons);
  }),

  getById: asyncHandler(async (req, res: Response) => {
    const coupon = await couponService.getById(req.params.id);
    return successResponse(res, coupon);
  }),

  create: asyncHandler(async (req, res: Response) => {
    const coupon = await couponService.create(req.body);
    return successResponse(res, coupon, { status: 201, message: 'Tạo mã giảm giá thành công' });
  }),

  update: asyncHandler(async (req, res: Response) => {
    const coupon = await couponService.update(req.params.id, req.body);
    return successResponse(res, coupon, { message: 'Cập nhật mã giảm giá thành công' });
  }),

  remove: asyncHandler(async (req, res: Response) => {
    await couponService.remove(req.params.id);
    return successResponse(res, null, { message: 'Xóa mã giảm giá thành công' });
  }),

  /** Public: validate a coupon against a subtotal. */
  apply: asyncHandler(async (req, res: Response) => {
    const result = await couponService.apply(req.body);
    return successResponse(res, result, { message: 'Áp dụng mã giảm giá thành công' });
  }),

  /** Public: list available coupons for a given subtotal. */
  available: asyncHandler(async (req, res: Response) => {
    const subtotal = Number(req.query.subtotal) || 0;
    const coupons = await couponService.listAvailable(subtotal);
    return successResponse(res, coupons);
  }),
};
