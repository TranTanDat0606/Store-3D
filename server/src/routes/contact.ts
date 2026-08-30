import { Router } from 'express';
import { contactController } from '../controllers/contactController';
import { validateRequest } from '../middleware/validate';
import { contactSchema } from '../validators/contact';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', validateRequest(contactSchema), contactController.submit);

router.get('/admin', requireAuth, requireAdmin, contactController.adminList);
router.get('/admin/new-count', requireAuth, requireAdmin, contactController.adminCountNew);
router.get('/admin/:id', requireAuth, requireAdmin, contactController.adminGetById);
router.put('/admin/:id/status', requireAuth, requireAdmin, contactController.adminUpdateStatus);
router.put('/admin/:id/note', requireAuth, requireAdmin, contactController.adminAddNote);

export default router;
