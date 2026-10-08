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
import coordinatorRouter from './coordinator.routes.js';
import auditRouter from './audit.routes.js';
import prisma from '../config/database.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// Enhanced Health Check Endpoint (Verifies Express & DB connectivity safely)
router.get('/health', async (req, res) => {
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'disconnected';
  }

  const isHealthy = dbStatus === 'healthy';
  return res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'RUVERSE API and Database are operational' : 'API operational, database connection degraded',
    data: {
      status: isHealthy ? 'healthy' : 'degraded',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    },
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

// Admin Dynamic Form Builder routes
router.use('/admin/events/:eventId/form', formRouter);

// Admin Registration routes
router.use('/admin/registrations', adminRegistrationRouter);

// Admin Coordinator routes
router.use('/admin/coordinators', coordinatorRouter);

// Admin Audit Log routes
router.use('/admin/audit-logs', auditRouter);

export default router;
