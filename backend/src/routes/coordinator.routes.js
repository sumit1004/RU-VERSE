import { Router } from 'express';
import {
  getCoordinators,
  getCoordinatorById,
  createCoordinator,
  updateCoordinator,
  resetCoordinatorPassword,
  getCoordinatorPermissions,
  updateCoordinatorPermissions,
  getCoordinatorEvents,
  updateCoordinatorEvents,
} from '../controllers/coordinator.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/permission.middleware.js';

const router = Router();

// Coordinator management is STRICTLY ADMIN ONLY (Requirement #11)
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', getCoordinators);
router.get('/:id', getCoordinatorById);
router.post('/', createCoordinator);
router.put('/:id', updateCoordinator);
router.patch('/:id/status', updateCoordinator);
router.patch('/:id/password', resetCoordinatorPassword);
router.get('/:id/permissions', getCoordinatorPermissions);
router.patch('/:id/permissions', updateCoordinatorPermissions);
router.get('/:id/events', getCoordinatorEvents);
router.patch('/:id/events', updateCoordinatorEvents);

export default router;

