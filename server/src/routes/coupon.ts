import { Router } from 'express';
import { couponController } from '../controllers/couponController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createCouponSchema, updateCouponSchema, applyCouponSchema } from '../validators/coupon';

const router = Router();

// Public
router.post('/apply', requireAuth, validateRequest(applyCouponSchema), couponController.apply);

// Admin CRUD
router.get('/', requireAuth, requireAdmin, couponController.list);
router.get('/:id', requireAuth, requireAdmin, couponController.getById);
router.post('/', requireAuth, requireAdmin, validateRequest(createCouponSchema), couponController.create);
router.put('/:id', requireAuth, requireAdmin, validateRequest(updateCouponSchema), couponController.update);
router.delete('/:id', requireAuth, requireAdmin, couponController.remove);

export default router;
