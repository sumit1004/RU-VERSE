import { prisma } from '../config/database.js';
import { comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
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
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== 'ACTIVE') {
    const error = new Error('Account is deactivated. Please contact the administrator.');
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Aggregate permissions
  const permissionsSet = new Set();
  if (user.role?.rolePermissions) {
    user.role.rolePermissions.forEach((rp) => {
      if (rp.permission?.slug) permissionsSet.add(rp.permission.slug);
    });
  }
  if (user.userPermissions) {
    user.userPermissions.forEach((up) => {
      if (up.permission?.slug) permissionsSet.add(up.permission.slug);
    });
  }

  const permissions = Array.from(permissionsSet);

  const token = generateToken({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
  });

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: {
      id: user.role.id,
      name: user.role.name,
      slug: user.role.slug,
    },
    permissions,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };

  return { token, user: userData };
};

export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  const permissionsSet = new Set();
  if (user.role?.rolePermissions) {
    user.role.rolePermissions.forEach((rp) => {
      if (rp.permission?.slug) permissionsSet.add(rp.permission.slug);
    });
  }
  if (user.userPermissions) {
    user.userPermissions.forEach((up) => {
      if (up.permission?.slug) permissionsSet.add(up.permission.slug);
    });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: {
      id: user.role.id,
      name: user.role.name,
      slug: user.role.slug,
    },
    permissions: Array.from(permissionsSet),
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
};
