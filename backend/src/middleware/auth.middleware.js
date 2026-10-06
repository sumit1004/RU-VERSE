import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../config/database.js';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // Check cookie first
    if (req.cookies && req.cookies[env.COOKIE_NAME]) {
      token = req.cookies[env.COOKIE_NAME];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Fallback for API clients with Bearer token
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Authentication required.', 401);
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return sendError(res, 'Invalid or expired authentication token.', 401);
    }

    // Load user with roles and all permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      return sendError(res, 'User account no longer exists.', 401);
    }

    if (user.status !== 'ACTIVE') {
      return sendError(res, 'Account is inactive. Please contact an administrator.', 403);
    }

    // Aggregate effective permissions
    const permissionsSet = new Set();

    if (user.role && user.role.rolePermissions) {
      user.role.rolePermissions.forEach((rp) => {
        if (rp.permission && rp.permission.slug) {
          permissionsSet.add(rp.permission.slug);
        }
      });
    }

    if (user.userPermissions) {
      user.userPermissions.forEach((up) => {
        if (up.permission && up.permission.slug) {
          permissionsSet.add(up.permission.slug);
        }
      });
    }

    // Attach sanitized user to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      role: {
        id: user.role.id,
        name: user.role.name,
        slug: user.role.slug,
      },
      status: user.status,
      permissions: Array.from(permissionsSet),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };

    next();
  } catch (err) {
    console.error('[requireAuth Error]:', err);
    return sendError(res, 'Authentication verification failed.', 401);
  }
};
