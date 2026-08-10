import { Router } from 'express';
import { authController } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updatePasswordSchema,
} from '../validators/auth';
import { authLimiter } from '../config/rateLimit';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), authController.login);
router.post('/logout', authController.logout);

router.get('/me', requireAuth, authController.me);
router.put('/profile', requireAuth, validateRequest(updateProfileSchema), authController.updateProfile);
router.put('/password', requireAuth, validateRequest(updatePasswordSchema), authController.updatePassword);

export default router;
