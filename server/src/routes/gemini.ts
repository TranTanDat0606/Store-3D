import { Router } from 'express';
import { geminiController } from '../controllers/geminiController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/game-asset', geminiController.generateGameAsset);
router.post('/generate', requireAdmin, geminiController.generateImage);

export default router;
