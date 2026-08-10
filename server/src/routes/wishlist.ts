import { Router } from 'express';
import { wishlistController } from '../controllers/wishlistController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', wishlistController.get);
router.post('/', wishlistController.add);
router.delete('/:productId', wishlistController.remove);
router.post('/move-to-cart', wishlistController.moveToCart);

export default router;
