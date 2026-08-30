import { Router } from 'express';
import { aiChatController } from '../controllers/aiChatController';
import { validateRequest } from '../middleware/validate';
import { chatMessageSchema } from '../validators/aiChat';
import { guestAiChatLimiter } from '../config/rateLimit';

const router = Router();

router.post('/', guestAiChatLimiter, validateRequest(chatMessageSchema), aiChatController.chat);

export default router;
