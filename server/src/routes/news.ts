import { Router } from 'express';
import { newsController } from '../controllers/newsController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createNewsSchema, updateNewsSchema, newsQuerySchema } from '../validators/news';

const router = Router();

// Public routes
router.get('/categories', newsController.categories);
router.get('/', validateRequest(newsQuerySchema, 'query'), newsController.list);
router.get('/:slug', newsController.getBySlug);

// Admin routes
router.get('/admin/all', requireAuth, requireAdmin, validateRequest(newsQuerySchema, 'query'), newsController.adminList);
router.get('/admin/:id', requireAuth, requireAdmin, newsController.adminGetById);
router.post('/admin', requireAuth, requireAdmin, validateRequest(createNewsSchema), newsController.create);
router.put('/admin/:id', requireAuth, requireAdmin, validateRequest(updateNewsSchema), newsController.update);
router.delete('/admin/:id', requireAuth, requireAdmin, newsController.remove);

export default router;
