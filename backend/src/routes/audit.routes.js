import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  requirePermission('audit.view'),
  getAuditLogs
);

export default router;
