import { Router } from 'express';
import {
  getPublicRegistration,
  submitPublicRegistration,
  getAdminRegistrations,
  getRegistrationDetails,
  updateRegistrationStatus,
  cancelRegistration,
  getEventRegistrations,
  getEventRegistrationSummary,
  exportRegistrations,
} from '../controllers/registration.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { requireEventAccess } from '../middleware/coordinator-scope.middleware.js';
import { registrationRateLimiter } from '../middleware/registration-rate-limit.js';

// Public Registration Router
export const publicRegistrationRouter = Router();

publicRegistrationRouter.get('/:slug/registration', getPublicRegistration);
publicRegistrationRouter.post('/:slug/registrations', registrationRateLimiter, submitPublicRegistration);

// Admin Registration Router
export const adminRegistrationRouter = Router();
adminRegistrationRouter.use(requireAuth);

adminRegistrationRouter.get(
  '/export',
  requirePermission('registrations.export'),
  exportRegistrations
);

adminRegistrationRouter.get(
  '/',
  requirePermission('registrations.view'),
  getAdminRegistrations
);

adminRegistrationRouter.get(
  '/:id',
  requirePermission('registrations.view'),
  requireEventAccess('id'),
  getRegistrationDetails
);

adminRegistrationRouter.patch(
  '/:id/status',
  requirePermission('registrations.edit'),
  requireEventAccess('id'),
  updateRegistrationStatus
);

adminRegistrationRouter.patch(
  '/:id/cancel',
  requirePermission('registrations.edit'),
  requireEventAccess('id'),
  cancelRegistration
);

// Admin Event-specific Registration Routes
export const adminEventRegistrationRouter = Router();
adminEventRegistrationRouter.use(requireAuth);

adminEventRegistrationRouter.get(
  '/:eventId/registrations',
  requirePermission('registrations.view'),
  requireEventAccess('eventId'),
  getEventRegistrations
);

adminEventRegistrationRouter.get(
  '/:eventId/registration-summary',
  requirePermission('registrations.view'),
  requireEventAccess('eventId'),
  getEventRegistrationSummary
);
