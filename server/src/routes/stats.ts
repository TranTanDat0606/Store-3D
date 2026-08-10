import { Router } from 'express';
import { statsController } from '../controllers/statsController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/overview', statsController.overview);
router.get('/revenue', statsController.revenueByDay);
router.get('/best-selling', statsController.bestSelling);
router.get('/orders-by-status', statsController.ordersByStatus);

export default router;
