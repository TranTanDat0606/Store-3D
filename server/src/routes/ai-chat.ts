import { Router } from 'express';
import { aiChatController } from '../controllers/aiChatController';
import { validateRequest } from '../middleware/validate';
import { chatMessageSchema } from '../validators/aiChat';
import { aiChatLimiter } from '../config/rateLimit';

const router = Router();

router.post('/', aiChatLimiter, validateRequest(chatMessageSchema), aiChatController.chat);

export default router;
