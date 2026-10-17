import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { updateSettingsSchema } from '../validators/settings';

const router = Router();

// Public: business info for the contact page/footer — no auth, and the payload
// only ever carries whitelisted keys with a non-empty configured value.
router.get('/public', settingsController.getPublic);

// Admin: configuration write. Zod strips unknown keys and enforces trim/≤200.
router.put(
  '/',
  requireAuth,
  requireAdmin,
  validateRequest(updateSettingsSchema),
  settingsController.update,
);

export default router;
