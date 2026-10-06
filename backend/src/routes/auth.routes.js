import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, getMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateLogin } from '../middleware/validation.middleware.js';

const router = Router();

// Rate limiter for authentication attempts (10 requests per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

router.post('/login', loginLimiter, validateLogin, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
