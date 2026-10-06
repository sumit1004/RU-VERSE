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
  requirePermission('categories.view'),
  getAdminCategoriesList
);

adminCategoryRouter.get(
  '/:id',
  requirePermission('categories.view'),
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
