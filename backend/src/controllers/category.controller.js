import {
  getPublicCategories,
  getAdminCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
} from '../services/category.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getPublicCategoriesList = async (req, res, next) => {
  try {
    const categories = await getPublicCategories();
    return sendSuccess(res, 'Public categories fetched successfully.', { categories });
  } catch (err) {
    next(err);
  }
};

export const getAdminCategoriesList = async (req, res, next) => {
  try {
    const categories = await getAdminCategories();
    return sendSuccess(res, 'Admin categories fetched successfully.', { categories });
  } catch (err) {
    next(err);
  }
};

export const getCategoryDetails = async (req, res, next) => {
  try {
    const category = await getCategoryById(req.params.id);
    if (!category) {
      return sendError(res, 'Category not found.', 404);
    }
    return sendSuccess(res, 'Category details retrieved.', { category });
  } catch (err) {
    next(err);
  }
};

export const createNewCategory = async (req, res, next) => {
  try {
    const { name, description, displayOrder, isActive } = req.body;
    const category = await createCategory({
      name,
      description,
      displayOrder,
      isActive,
      userId: req.user?.id,
    });
    return sendSuccess(res, 'Category created successfully.', { category }, 201);
  } catch (err) {
    next(err);
  }
};

export const updateExistingCategory = async (req, res, next) => {
  try {
    const { name, description, displayOrder, isActive } = req.body;
    const category = await updateCategory(req.params.id, {
      name,
      description,
      displayOrder,
      isActive,
      userId: req.user?.id,
    });
    return sendSuccess(res, 'Category updated successfully.', { category });
  } catch (err) {
    next(err);
  }
};

export const patchCategoryStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return sendError(res, 'isActive must be a boolean value.', 422, {
        isActive: 'isActive must be a boolean value (true or false).',
      });
    }

    const category = await updateCategoryStatus(req.params.id, isActive, req.user?.id);
    return sendSuccess(res, `Category ${isActive ? 'activated' : 'deactivated'} successfully.`, { category });
  } catch (err) {
    next(err);
  }
};

export const deleteCategoryById = async (req, res, next) => {
  try {
    await deleteCategory(req.params.id);
    return sendSuccess(res, 'Category deleted successfully.');
  } catch (err) {
    next(err);
  }
};
