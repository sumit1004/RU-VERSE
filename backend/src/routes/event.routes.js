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
  validateEvent,
  updateExistingEvent
);

adminEventRouter.patch(
  '/:id/publish',
  requirePermission('events.edit'),
  patchEventPublish
);

adminEventRouter.patch(
  '/:id/status',
  requirePermission('events.edit'),
  patchEventStatus
);

adminEventRouter.patch(
  '/:id/featured',
  requirePermission('events.edit'),
  patchEventFeatured
);

adminEventRouter.patch(
  '/:id/open-for-all',
  requirePermission('events.edit'),
  patchEventOpenForAll
);

adminEventRouter.patch(
  '/:id/archive',
  requirePermission('events.archive'),
  patchEventArchive
);

adminEventRouter.delete(
  '/:id',
  requirePermission('events.archive'),
  deleteEventHandler
);
