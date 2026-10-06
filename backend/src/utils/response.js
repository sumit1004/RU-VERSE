/**
 * Standardized API Response Utilities
 */

export const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message,
  };

  if (errors && Object.keys(errors).length > 0) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};
