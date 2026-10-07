import { Router } from 'express';
import authRouter from './auth.routes.js';
import { publicCategoryRouter, adminCategoryRouter } from './category.routes.js';
import { publicEventRouter, adminEventRouter } from './event.routes.js';
import formRouter from './form.routes.js';
import {
  publicRegistrationRouter,
  adminRegistrationRouter,
  adminEventRegistrationRouter,
} from './registration.routes.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  return sendSuccess(res, 'RUVERSE API is running', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
router.use('/auth', authRouter);

// Public Category routes
router.use('/categories', publicCategoryRouter);

// Admin Category routes
router.use('/admin/categories', adminCategoryRouter);

// Public Event routes & Public Registration routes
router.use('/events', publicEventRouter);
router.use('/events', publicRegistrationRouter);

// Admin Event routes & Admin Event-specific Registration routes
router.use('/admin/events', adminEventRouter);
router.use('/admin/events', adminEventRegistrationRouter);

import coordinatorRouter from './coordinator.routes.js';
import auditRouter from './audit.routes.js';

// Admin Dynamic Form Builder routes
router.use('/admin/events/:eventId/form', formRouter);

// Admin Registration routes
router.use('/admin/registrations', adminRegistrationRouter);

// Admin Coordinator routes
router.use('/admin/coordinators', coordinatorRouter);

// Admin Audit Log routes
router.use('/admin/audit-logs', auditRouter);

export default router;
