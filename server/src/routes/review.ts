import { Router } from 'express';
import { reviewController } from '../controllers/reviewController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createReviewSchema, updateReviewSchema } from '../validators/review';

const router = Router();

// Public: list reviews for a product
router.get('/product/:productId', reviewController.listByProduct);

// Admin: list all reviews + delete any review
router.get('/admin', requireAuth, requireAdmin, reviewController.listAll);
router.delete('/admin/:id', requireAuth, requireAdmin, reviewController.adminRemove);

// Customer: create/update/delete their own reviews + check eligibility
router.get('/me/:productId', requireAuth, reviewController.myEligibility);
router.post('/', requireAuth, validateRequest(createReviewSchema), reviewController.create);
router.put('/:id', requireAuth, validateRequest(updateReviewSchema), reviewController.update);
router.delete('/:id', requireAuth, reviewController.remove);

export default router;
