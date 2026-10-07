import { sendError } from '../utils/response.js';

export const requirePermission = (permissionSlug) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    // Admins or users possessing the specific permission slug
    const hasPermission =
      req.user.role?.slug === 'admin' ||
      (Array.isArray(req.user.permissions) && req.user.permissions.includes(permissionSlug));

    if (!hasPermission) {
      return sendError(res, 'You do not have permission to perform this action.', 403);
    }

    next();
  };
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required.', 401);
  }

  if (req.user.role?.slug !== 'admin') {
    return sendError(res, 'Administrator privileges required for this action.', 403);
  }

  next();
};
