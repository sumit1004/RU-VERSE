import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

export const registrationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 registration requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many registration requests from this IP. Please wait a few minutes before trying again.',
      429,
      { code: 'RATE_LIMIT_EXCEEDED' }
    );
  },
});
