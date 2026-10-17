import { Router } from 'express';
import { productController } from '../controllers/productController';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../validators/product';

const router = Router();

// Optional auth: lets an admin session see every product status while the
// anonymous/customer path stays forced-active (read-only route, never mutating).
router.get('/', optionalAuth, validateRequest(productQuerySchema, 'query'), productController.list);
router.get('/featured', productController.featured);
router.get('/:slug', productController.getBySlug);
router.get('/:id/related', productController.related);

router.post('/', requireAuth, requireAdmin, validateRequest(createProductSchema), productController.create);
router.put('/:id', requireAuth, requireAdmin, validateRequest(updateProductSchema), productController.update);
router.delete('/:id', requireAuth, requireAdmin, productController.remove);

export default router;
