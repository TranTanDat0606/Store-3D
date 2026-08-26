import { Router } from 'express';
import { contactController } from '../controllers/contactController';
import { validateRequest } from '../middleware/validate';
import { contactSchema } from '../validators/contact';

const router = Router();

router.post('/', validateRequest(contactSchema), contactController.submit);

export default router;
