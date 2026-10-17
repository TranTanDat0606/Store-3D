import { Response } from 'express';
import { couponService } from '../services/couponService';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { parsePreviewItems } from '../validators/coupon';
import type { AuthRequest } from '../middleware/auth';

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

  /** Public: validate a coupon against a subtotal (server-priced when items given). */
  apply: asyncHandler(async (req: AuthRequest, res: Response) => {
    const preview = await couponService.resolvePreview({
      code: req.body.code,
      items: req.body.items,
      subtotal: req.body.subtotal,
      userId: req.user!._id,
    });
    return successResponse(
      res,
      {
        // `coupon` + `discount` are the legacy shape the current client reads.
        coupon: preview.coupon,
        discount: preview.discountVnd,
        discountVnd: preview.discountVnd,
        subtotalVnd: preview.subtotalVnd,
        basis: preview.basis,
        capped: preview.capped,
      },
      { message: 'Áp dụng mã giảm giá thành công' },
    );
  }),

  /** Public: list available coupons for a given subtotal. */
  available: asyncHandler(async (req, res: Response) => {
    const items = parsePreviewItems(req.query.items);
    const subtotal = Number(req.query.subtotal) || 0;
    const preview = await couponService.resolvePreview({ items, subtotal });
    const coupons = await couponService.listAvailable(preview.subtotalVnd, preview.basis);
    return successResponse(res, coupons);
  }),

  /** Authenticated: list eligible coupons (admin + game) for checkout. */
  eligible: asyncHandler(async (req: AuthRequest, res: Response) => {
    const items = parsePreviewItems(req.query.items);
    const subtotal = Number(req.query.subtotal) || 0;
    const preview = await couponService.resolvePreview({ items, subtotal });
    const coupons = await couponService.getEligibleCoupons(preview.subtotalVnd, req.user!._id, preview.basis);
    return successResponse(res, coupons);
  }),
};
