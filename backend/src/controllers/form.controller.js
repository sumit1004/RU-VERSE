import {
  getOrCreateEventForm,
  updateFormSettings,
  addFieldToForm,
  updateFormField,
  deleteFormField,
  reorderFormFields,
  publishEventForm,
} from '../services/form.service.js';
import { sendSuccess } from '../utils/response.js';

export const getEventFormHandler = async (req, res, next) => {
  try {
    const data = await getOrCreateEventForm(req.params.eventId, req.user?.id);
    return sendSuccess(res, 'Event registration form retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};

export const updateFormSettingsHandler = async (req, res, next) => {
  try {
    const form = await updateFormSettings(
      req.params.eventId,
      req.body,
      req.user?.id
    );
    return sendSuccess(res, 'Registration form settings saved successfully.', { form });
  } catch (err) {
    next(err);
  }
};

export const addFieldHandler = async (req, res, next) => {
  try {
    const field = await addFieldToForm(
      req.params.eventId,
      req.body,
      req.user?.id
    );
    return sendSuccess(res, 'Form field added successfully.', { field }, 201);
  } catch (err) {
    next(err);
  }
};

export const updateFieldHandler = async (req, res, next) => {
  try {
    const field = await updateFormField(
      req.params.eventId,
      req.params.fieldId,
      req.body,
      req.user?.id
    );
    return sendSuccess(res, 'Form field updated successfully.', { field });
  } catch (err) {
    next(err);
  }
};

export const deleteFieldHandler = async (req, res, next) => {
  try {
    await deleteFormField(
      req.params.eventId,
      req.params.fieldId,
      req.user?.id
    );
    return sendSuccess(res, 'Form field deleted successfully.');
  } catch (err) {
    next(err);
  }
};

export const reorderFieldsHandler = async (req, res, next) => {
  try {
    const fields = await reorderFormFields(
      req.params.eventId,
      req.body.fieldOrders,
      req.user?.id
    );
    return sendSuccess(res, 'Form fields reordered successfully.', { fields });
  } catch (err) {
    next(err);
  }
};

export const publishFormHandler = async (req, res, next) => {
  try {
    const form = await publishEventForm(
      req.params.eventId,
      req.user?.id
    );
    return sendSuccess(res, 'Registration form published successfully.', { form });
  } catch (err) {
    next(err);
  }
};
