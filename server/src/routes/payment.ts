import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { config } from '../config';
import { paymentService, webhookRoutePolicy } from '../services/paymentService';
import { successResponse } from '../utils/apiResponse';

const router = Router();

// GAP-10: in production the signature check is MANDATORY (boot already
// refused to start without PAYMENT_WEBHOOK_SECRET — see server.ts) and the
// /webhook/simulate route is never registered. Development keeps current
// behavior: signature enforced only when a secret is configured, simulate
// route available for local QA.
const policy = webhookRoutePolicy(config.env, Boolean(config.paymentWebhookSecret));

router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-payment-signature'];
    if (policy.requireSignature && (!config.paymentWebhookSecret || signature !== config.paymentWebhookSecret)) {
      throw new AppError('Chữ ký webhook không hợp lệ', 401);
    }
    const { orderCode, amount } = req.body ?? {};
    await paymentService.markOrderPaid(String(orderCode ?? ''), Number(amount));
    return successResponse(res, { status: 'success' }, { message: 'Thanh toán được xác nhận' });
  }),
);

if (policy.simulateEnabled) {
  router.post(
    '/webhook/simulate',
    asyncHandler(async (req, res) => {
      // Defense in depth on top of the conditional registration above.
      if (config.env === 'production') throw new AppError('Không tìm thấy trang', 404);
      const { orderCode, amount } = req.body ?? {};
      await paymentService.markOrderPaid(String(orderCode ?? ''), Number(amount));
      return successResponse(res, { status: 'success' }, { message: 'Thanh toán được xác nhận' });
    }),
  );
}

export default router;
