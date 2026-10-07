import {
  getPublicEvents,
  getPublicEventBySlug,
  getAdminEvents,
  getEventById,
  createEvent,
  updateEvent,
  updateEventPublishStatus,
  updateEventActiveStatus,
  updateEventFeaturedStatus,
  updateEventOpenForAllStatus,
  archiveEvent,
} from '../services/event.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getPublicEventsList = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const events = await getPublicEvents({
      categorySlug: category,
      search,
    });
    return sendSuccess(res, 'Public events fetched successfully.', { events });
  } catch (err) {
    next(err);
  }
};

export const getPublicEventDetail = async (req, res, next) => {
  try {
    const event = await getPublicEventBySlug(req.params.slug);
    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }
    return sendSuccess(res, 'Event details fetched successfully.', { event });
  } catch (err) {
    next(err);
  }
};

export const getAdminEventsList = async (req, res, next) => {
  try {
    const {
      search,
      categoryId,
      status,
      registrationType,
      isFeatured,
      isOpenForAll,
      includeArchived,
    } = req.query;

    const events = await getAdminEvents({
      search,
      categoryId,
      status,
      registrationType,
      isFeatured,
      isOpenForAll,
      includeArchived: includeArchived === 'true',
    });

    return sendSuccess(res, 'Admin events retrieved successfully.', { events });
  } catch (err) {
    next(err);
  }
};

export const getAdminEventDetail = async (req, res, next) => {
  try {
    const event = await getEventById(req.params.id);
    if (!event) {
      return sendError(res, 'Event not found.', 404);
    }
    return sendSuccess(res, 'Event details retrieved.', { event });
  } catch (err) {
    next(err);
  }
};

export const createNewEvent = async (req, res, next) => {
  try {
    const event = await createEvent(req.body, req.user?.id);
    return sendSuccess(res, 'Event created successfully.', { event }, 201);
  } catch (err) {
    next(err);
  }
};

export const updateExistingEvent = async (req, res, next) => {
  try {
    const event = await updateEvent(req.params.id, req.body, req.user?.id);
    return sendSuccess(res, 'Event updated successfully.', { event });
  } catch (err) {
    next(err);
  }
};

export const patchEventPublish = async (req, res, next) => {
  try {
    const { isPublished } = req.body;
    if (typeof isPublished !== 'boolean') {
      return sendError(res, 'isPublished must be a boolean value.', 422, {
        isPublished: 'isPublished must be true or false.',
      });
    }
    const event = await updateEventPublishStatus(req.params.id, isPublished, req.user?.id);
    return sendSuccess(
      res,
      `Event ${isPublished ? 'published' : 'unpublished'} successfully.`,
      { event }
    );
  } catch (err) {
    next(err);
  }
};

export const patchEventStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return sendError(res, 'isActive must be a boolean value.', 422, {
        isActive: 'isActive must be true or false.',
      });
    }
    const event = await updateEventActiveStatus(req.params.id, isActive, req.user?.id);
    return sendSuccess(
      res,
      `Event ${isActive ? 'activated' : 'deactivated'} successfully.`,
      { event }
    );
  } catch (err) {
    next(err);
  }
};

export const patchEventFeatured = async (req, res, next) => {
  try {
    const { isFeatured } = req.body;
    if (typeof isFeatured !== 'boolean') {
      return sendError(res, 'isFeatured must be a boolean value.', 422, {
        isFeatured: 'isFeatured must be true or false.',
      });
    }
    const event = await updateEventFeaturedStatus(req.params.id, isFeatured, req.user?.id);
    return sendSuccess(
      res,
      `Event ${isFeatured ? 'marked as featured' : 'unmarked as featured'}.`,
      { event }
    );
  } catch (err) {
    next(err);
  }
};

export const patchEventOpenForAll = async (req, res, next) => {
  try {
    const { isOpenForAll } = req.body;
    if (typeof isOpenForAll !== 'boolean') {
      return sendError(res, 'isOpenForAll must be a boolean value.', 422, {
        isOpenForAll: 'isOpenForAll must be true or false.',
      });
    }
    const event = await updateEventOpenForAllStatus(req.params.id, isOpenForAll, req.user?.id);
    return sendSuccess(
      res,
      `Event ${isOpenForAll ? 'opened for all' : 'restricted'}.`,
      { event }
    );
  } catch (err) {
    next(err);
  }
};

export const patchEventArchive = async (req, res, next) => {
  try {
    const { archive = true } = req.body;
    const event = await archiveEvent(req.params.id, Boolean(archive), req.user?.id);
    return sendSuccess(
      res,
      `Event ${archive ? 'archived' : 'restored'} successfully.`,
      { event }
    );
  } catch (err) {
    next(err);
  }
};

export const deleteOrArchiveEventHandler = async (req, res, next) => {
  try {
    // Standard safe policy: archive instead of hard deleting
    const event = await archiveEvent(req.params.id, true, req.user?.id);
    return sendSuccess(res, 'Event archived safely (hard deletion prevented).', { event });
  } catch (err) {
    next(err);
  }
};
