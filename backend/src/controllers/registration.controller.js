import * as registrationService from '../services/registration.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * GET /api/events/:slug/registration
 * Public endpoint to fetch event info, availability status, and published dynamic form schema
 */
export const getPublicRegistration = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const data = await registrationService.getPublicRegistrationData(slug);
    return sendSuccess(res, 'Registration form retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/events/:slug/registrations
 * Public endpoint to submit event registration
 */
export const submitPublicRegistration = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await registrationService.submitPublicRegistration(slug, req.body);
    return sendSuccess(res, 'Registration submitted successfully.', result, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/events/:slug/registrations
 * Public endpoint to fetch privacy-safe event registrations list
 */
export const getPublicEventRegistrations = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { search, type, page, limit, sortBy, sortOrder } = req.query;

    const data = await registrationService.getPublicEventRegistrations(slug, {
      search,
      type,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return sendSuccess(res, 'Public registrations retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/registrations
 * Admin endpoint to list and search all registrations with pagination and filters
 */
export const getAdminRegistrations = async (req, res, next) => {
  try {
    const {
      eventId,
      status,
      registrationType,
      search,
      from,
      to,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const coordinatorUserId = req.user?.role?.slug === 'coordinator' ? req.user.id : null;

    const data = await registrationService.getAdminRegistrations({
      eventId,
      status,
      registrationType,
      search,
      from,
      to,
      page,
      limit,
      sortBy,
      sortOrder,
      coordinatorUserId,
    });

    return sendSuccess(res, 'Registrations retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/registrations/:id
 * Admin endpoint to fetch full registration detail with participant snapshots
 */
export const getRegistrationDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const registration = await registrationService.getRegistrationById(id);
    return sendSuccess(res, 'Registration details retrieved successfully.', registration);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/registrations/:id/status
 * Admin endpoint to update registration status (PENDING, CONFIRMED, CANCELLED, REJECTED, WAITLISTED)
 */
export const updateRegistrationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const updated = await registrationService.updateRegistrationStatus(id, status, notes, req.user?.id);
    return sendSuccess(res, `Registration status updated to ${status}.`, updated);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/registrations/:id/cancel
 * Admin endpoint to cancel registration safely
 */
export const cancelRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cancelled = await registrationService.updateRegistrationStatus(id, 'CANCELLED', req.body.notes || null, req.user?.id);
    return sendSuccess(res, 'Registration cancelled successfully.', cancelled);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/events/:eventId/registrations
 * Admin endpoint for event-specific registrations
 */
export const getEventRegistrations = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { status, registrationType, search, from, to, page, limit, sortBy, sortOrder } = req.query;

    const data = await registrationService.getAdminRegistrations({
      eventId,
      status,
      registrationType,
      search,
      from,
      to,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return sendSuccess(res, 'Event registrations retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/events/:eventId/registration-summary
 * Admin endpoint for real-time registration counts and capacity summary
 */
export const getEventRegistrationSummary = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const summary = await registrationService.getEventRegistrationSummary(eventId);
    return sendSuccess(res, 'Event registration summary retrieved successfully.', summary);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/registrations/export
 * Admin / Coordinator endpoint to export registration records to CSV
 */
export const exportRegistrations = async (req, res, next) => {
  try {
    const { eventId, status, registrationType, from, to } = req.query;
    const { csvContent, rowCount } = await registrationService.exportRegistrations({
      eventId,
      status,
      registrationType,
      from,
      to,
      user: req.user,
      req,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ruverse_registrations_${Date.now()}.csv"`);
    res.setHeader('X-Total-Count', String(rowCount));
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/registrations/:id
 * Admin endpoint to permanently delete a registration record
 */
export const deleteRegistrationHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await registrationService.deleteRegistration(id, req.user, req);
    return sendSuccess(res, 'Registration deleted successfully.', result);
  } catch (err) {
    next(err);
  }
};

