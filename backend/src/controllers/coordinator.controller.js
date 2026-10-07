import * as coordinatorService from '../services/coordinator.service.js';
import { sendSuccess } from '../utils/response.js';

export const getCoordinators = async (req, res, next) => {
  try {
    const { search, status, page, limit } = req.query;
    const data = await coordinatorService.getCoordinators({ search, status, page, limit });
    return sendSuccess(res, 'Coordinators retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

export const getCoordinatorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await coordinatorService.getCoordinatorById(id);
    return sendSuccess(res, 'Coordinator details retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

export const createCoordinator = async (req, res, next) => {
  try {
    const data = await coordinatorService.createCoordinator(req.body, req.user.id, req);
    return sendSuccess(res, 'Coordinator created successfully.', data, 201);
  } catch (err) {
    next(err);
  }
};

export const updateCoordinator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await coordinatorService.updateCoordinator(id, req.body, req.user.id, req);
    return sendSuccess(res, 'Coordinator updated successfully.', data);
  } catch (err) {
    next(err);
  }
};

export const resetCoordinatorPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const data = await coordinatorService.resetCoordinatorPassword(id, newPassword, req.user.id, req);
    return sendSuccess(res, 'Coordinator password reset successfully.', data);
  } catch (err) {
    next(err);
  }
};

export const getCoordinatorPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await coordinatorService.getCoordinatorPermissions(id);
    return sendSuccess(res, 'Coordinator permissions retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

export const updateCoordinatorPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    const data = await coordinatorService.updateCoordinatorPermissions(id, permissions, req.user.id, req);
    return sendSuccess(res, 'Coordinator permissions updated successfully.', data);
  } catch (err) {
    next(err);
  }
};

export const getCoordinatorEvents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await coordinatorService.getCoordinatorEvents(id);
    return sendSuccess(res, 'Coordinator event assignments retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

export const updateCoordinatorEvents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { eventIds } = req.body;
    const data = await coordinatorService.updateCoordinatorEvents(id, eventIds, req.user.id, req);
    return sendSuccess(res, 'Coordinator event assignments updated successfully.', data);
  } catch (err) {
    next(err);
  }
};

export const deleteCoordinator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await coordinatorService.deleteCoordinator(id, req.user.id, req);
    return sendSuccess(res, 'Coordinator deleted successfully.', data);
  } catch (err) {
    next(err);
  }
};
