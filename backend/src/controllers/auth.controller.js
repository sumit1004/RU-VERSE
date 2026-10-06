import { loginUser, getUserById } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { getAuthCookieOptions, getClearCookieOptions } from '../utils/jwt.js';
import { env } from '../config/env.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await loginUser({ email, password });

    // Set secure HTTP-only cookie
    const cookieOptions = getAuthCookieOptions();
    res.cookie(env.COOKIE_NAME, token, cookieOptions);

    return sendSuccess(res, 'Login successful.', { user });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const cookieOptions = getClearCookieOptions();
    res.clearCookie(env.COOKIE_NAME, cookieOptions);

    return sendSuccess(res, 'Logout successful.');
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'Authentication required.', 401);
    }

    // Refresh user state from database
    const freshUser = await getUserById(req.user.id);
    if (!freshUser) {
      return sendError(res, 'User account is inactive or not found.', 401);
    }

    return sendSuccess(res, 'User session verified.', { user: freshUser });
  } catch (err) {
    next(err);
  }
};
