import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    return null;
  }
};

export const getAuthCookieOptions = () => {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: '/',
  };
};

export const getClearCookieOptions = () => {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
};
