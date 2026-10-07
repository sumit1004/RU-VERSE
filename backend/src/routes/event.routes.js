import { Router } from 'express';
import {
  getPublicEventsList,
  getPublicEventDetail,
  getAdminEventsList,
  getAdminEventDetail,
  createNewEvent,
  updateExistingEvent,
  patchEventPublish,
  patchEventStatus,
  patchEventFeatured,
  patchEventOpenForAll,
  patchEventArchive,
  deleteEventHandler,
} from '../controllers/event.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { requireEventAccess } from '../middleware/coordinator-scope.middleware.js';
import { validateEvent } from '../validators/event.validator.js';

// Public Router
export const publicEventRouter = Router();
publicEventRouter.get('/', getPublicEventsList);
publicEventRouter.get('/:slug', getPublicEventDetail);

// Admin Router
export const adminEventRouter = Router();
adminEventRouter.use(requireAuth);

adminEventRouter.get(
  '/',
  requirePermission('events.view'),
  getAdminEventsList
);

adminEventRouter.get(
  '/:id',
  requirePermission('events.view'),
  getAdminEventDetail
);

adminEventRouter.post(
  '/',
  requirePermission('events.create'),
  validateEvent,
  createNewEvent
);

adminEventRouter.put(
  '/:id',
  requirePermission('events.edit'),
  requireEventAccess('id', 'event'),
  validateEvent,
  updateExistingEvent
);

adminEventRouter.patch(
  '/:id/publish',
  requirePermission('events.edit'),
  requireEventAccess('id', 'event'),
  patchEventPublish
);

adminEventRouter.patch(
  '/:id/status',
  requirePermission('events.edit'),
  requireEventAccess('id', 'event'),
  patchEventStatus
);

adminEventRouter.patch(
  '/:id/featured',
  requirePermission('events.edit'),
  requireEventAccess('id', 'event'),
  patchEventFeatured
);

adminEventRouter.patch(
  '/:id/open-for-all',
  requirePermission('events.edit'),
  requireEventAccess('id', 'event'),
  patchEventOpenForAll
);

adminEventRouter.patch(
  '/:id/archive',
  requirePermission('events.archive'),
  requireEventAccess('id', 'event'),
  patchEventArchive
);

adminEventRouter.delete(
  '/:id',
  requirePermission('events.archive'),
  requireEventAccess('id', 'event'),
  deleteEventHandler
);
