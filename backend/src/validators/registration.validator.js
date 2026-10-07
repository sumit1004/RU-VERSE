import { z } from 'zod';

const phoneRegex = /^[6-9]\d{9}$|^(\+?\d{1,3}[- ]?)?\d{10,14}$/;

export const participantFixedSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  mobile: z
    .string({ required_error: 'Mobile number is required' })
    .trim()
    .regex(phoneRegex, 'Please enter a valid 10-digit mobile number'),
  college: z
    .string({ required_error: 'College name is required' })
    .trim()
    .min(2, 'College name must be at least 2 characters')
    .max(191, 'College name cannot exceed 191 characters'),
});

export const participantInputSchema = z.object({
  fixed: participantFixedSchema,
  custom: z.record(z.any()).optional().default({}),
});

export const publicRegistrationSubmissionSchema = z.object({
  registrationType: z.enum(['INDIVIDUAL', 'TEAM'], {
    required_error: 'Registration type is required (INDIVIDUAL or TEAM)',
  }),
  teamName: z
    .string()
    .trim()
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name cannot exceed 100 characters')
    .optional()
    .nullable(),
  participants: z
    .array(participantInputSchema)
    .min(1, 'At least one participant is required'),
  registrationFields: z.record(z.any()).optional().default({}),
  formVersion: z.number().int().positive().optional(),
});

export const updateRegistrationStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'WAITLISTED'], {
    required_error: 'Valid status is required',
  }),
  notes: z.string().trim().max(500).optional(),
});

export const registrationQuerySchema = z.object({
  eventId: z.coerce.number().int().positive().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'WAITLISTED']).optional(),
  registrationType: z.enum(['INDIVIDUAL', 'TEAM']).optional(),
  search: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  sortBy: z.enum(['submittedAt', 'registrationNumber', 'teamName', 'status']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
