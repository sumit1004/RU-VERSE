import { Router } from 'express';
import {
  getPublicCategoriesList,
  getAdminCategoriesList,
  getCategoryDetails,
  createNewCategory,
  updateExistingCategory,
  patchCategoryStatus,
  deleteCategoryById,
} from '../controllers/category.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { validateCategory } from '../middleware/validation.middleware.js';

// Public Router
export const publicCategoryRouter = Router();
publicCategoryRouter.get('/', getPublicCategoriesList);

// Admin Router
export const adminCategoryRouter = Router();
adminCategoryRouter.use(requireAuth);

adminCategoryRouter.get(
  '/',
  (req, res, next) => {
    const user = req.user;
    const hasPerm =
      user?.role?.slug === 'admin' ||
      (Array.isArray(user?.permissions) &&
        (user.permissions.includes('categories.view') ||
          user.permissions.includes('events.create') ||
          user.permissions.includes('events.edit') ||
          user.permissions.includes('events.view')));

    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view categories.',
      });
    }
    next();
  },
  getAdminCategoriesList
);

adminCategoryRouter.get(
  '/:id',
  (req, res, next) => {
    const user = req.user;
    const hasPerm =
      user?.role?.slug === 'admin' ||
      (Array.isArray(user?.permissions) &&
        (user.permissions.includes('categories.view') ||
          user.permissions.includes('events.create') ||
          user.permissions.includes('events.edit') ||
          user.permissions.includes('events.view')));

    if (!hasPerm) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view categories.',
      });
    }
    next();
  },
  getCategoryDetails
);

adminCategoryRouter.post(
  '/',
  requirePermission('categories.create'),
  validateCategory,
  createNewCategory
);

adminCategoryRouter.put(
  '/:id',
  requirePermission('categories.edit'),
  validateCategory,
  updateExistingCategory
);

adminCategoryRouter.patch(
  '/:id/status',
  requirePermission('categories.edit'),
  patchCategoryStatus
);

adminCategoryRouter.delete(
  '/:id',
  requirePermission('categories.delete'),
  deleteCategoryById
);
