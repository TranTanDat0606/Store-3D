import { Router } from 'express';
import { userController } from '../controllers/userController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', userController.list);
router.get('/:id', userController.getById);
router.put('/:id/role', userController.updateRole);
router.put('/:id/active', userController.toggleActive);
router.delete('/:id', userController.remove);

export default router;
