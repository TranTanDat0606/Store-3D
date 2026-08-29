import { Router } from 'express';
import { rewardController } from '../controllers/rewardController';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { startGameSchema, completeGameSchema } from '../validators/reward';

const router = Router();

router.use(requireAuth);

router.post('/game/start', validateRequest(startGameSchema), rewardController.startGame);
router.post('/game/complete', validateRequest(completeGameSchema), rewardController.completeGame);
router.get('/my-coupons', rewardController.getMyCoupons);

export default router;
