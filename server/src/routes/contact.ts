import { Router } from 'express';
import { contactController } from '../controllers/contactController';
import { validateRequest } from '../middleware/validate';
import { contactSchema } from '../validators/contact';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', validateRequest(contactSchema), contactController.submit);

router.get('/admin', requireAuth, contactController.adminList);
router.get('/admin/new-count', requireAuth, contactController.adminCountNew);
router.get('/admin/:id', requireAuth, contactController.adminGetById);
router.put('/admin/:id/status', requireAuth, contactController.adminUpdateStatus);
router.put('/admin/:id/note', requireAuth, contactController.adminAddNote);

export default router;
