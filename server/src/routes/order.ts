import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema, orderQuerySchema } from '../validators/order';

const router = Router();

// Admin routes first to avoid capture conflicts
router.get('/admin', requireAuth, requireAdmin, validateRequest(orderQuerySchema, 'query'), orderController.adminList);
router.put('/admin/:id/status', requireAuth, requireAdmin, validateRequest(updateOrderStatusSchema), orderController.adminUpdateStatus);

// Customer routes
router.post('/', requireAuth, validateRequest(createOrderSchema), orderController.create);
router.get('/mine', requireAuth, validateRequest(orderQuerySchema, 'query'), orderController.mine);
router.post('/:id/cancel', requireAuth, orderController.cancelByUser);
router.get('/:id', requireAuth, orderController.getById);
router.post('/:id/payment-qr', requireAuth, orderController.createPaymentQr);

export default router;
