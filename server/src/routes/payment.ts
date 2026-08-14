import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { config } from '../config';
import { paymentService } from '../services/paymentService';
import { successResponse } from '../utils/apiResponse';

const router = Router();

router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    if (config.paymentWebhookSecret && req.headers['x-payment-signature'] !== config.paymentWebhookSecret) {
      throw new AppError('Chữ ký webhook không hợp lệ', 401);
    }
    const { orderCode, amount } = req.body ?? {};
    await paymentService.markOrderPaid(String(orderCode ?? ''), Number(amount));
    return successResponse(res, { status: 'success' }, { message: 'Thanh toán được xác nhận' });
  }),
);

router.post(
  '/webhook/simulate',
  asyncHandler(async (req, res) => {
    if (config.env === 'production') throw new AppError('Không tìm thấy trang', 404);
    const { orderCode, amount } = req.body ?? {};
    await paymentService.markOrderPaid(String(orderCode ?? ''), Number(amount));
    return successResponse(res, { status: 'success' }, { message: 'Thanh toán được xác nhận' });
  }),
);

export default router;
