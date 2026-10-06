import { sendError } from '../utils/response.js';

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.email = 'Email address is required.';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'Validation failed.', 422, errors);
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

export const validateCategory = (req, res, next) => {
  const { name, description, displayOrder, isActive } = req.body;
  const errors = {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.name = 'Category name is required.';
  } else if (name.trim().length < 2) {
    errors.name = 'Category name must be at least 2 characters long.';
  } else if (name.trim().length > 100) {
    errors.name = 'Category name cannot exceed 100 characters.';
  }

  if (displayOrder !== undefined && displayOrder !== null) {
    const parsedOrder = parseInt(displayOrder, 10);
    if (isNaN(parsedOrder)) {
      errors.displayOrder = 'Display order must be an integer.';
    }
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.isActive = 'Active status must be a boolean value.';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'Validation failed.', 422, errors);
  }

  req.body.name = name.trim();
  if (description !== undefined && description !== null) {
    req.body.description = String(description).trim();
  }
  if (displayOrder !== undefined) {
    req.body.displayOrder = parseInt(displayOrder, 10) || 0;
  }
  next();
};
