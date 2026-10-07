import { z } from 'zod';

export const createCoordinatorSchema = z.object({
  name: z
    .string({ required_error: 'Coordinator name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  permissions: z.array(z.string()).optional().default([]),
  eventIds: z.array(z.coerce.number().int().positive()).optional().default([]),
});

export const updateCoordinatorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters'),
});

export const updatePermissionsSchema = z.object({
  permissions: z.array(z.string(), {
    required_error: 'Permissions array is required',
  }),
});

export const updateEventsSchema = z.object({
  eventIds: z.array(z.coerce.number().int().positive(), {
    required_error: 'Event IDs array is required',
  }),
});
