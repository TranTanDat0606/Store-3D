import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/category';

const router = Router();

router.get('/', categoryController.list);
router.get('/all', categoryController.all);
router.get('/:slug', categoryController.getBySlug);

router.post('/', requireAuth, requireAdmin, validateRequest(createCategorySchema), categoryController.create);
router.put('/:id', requireAuth, requireAdmin, validateRequest(updateCategorySchema), categoryController.update);
router.delete('/:id', requireAuth, requireAdmin, categoryController.remove);

export default router;
