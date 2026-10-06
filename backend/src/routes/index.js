import { Router } from 'express';
import authRouter from './auth.routes.js';
import { publicCategoryRouter, adminCategoryRouter } from './category.routes.js';
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

export default router;
