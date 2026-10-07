import { Router } from 'express';
import {
  getEventFormHandler,
  updateFormSettingsHandler,
  addFieldHandler,
  updateFieldHandler,
  deleteFieldHandler,
  reorderFieldsHandler,
  publishFormHandler,
} from '../controllers/form.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/permission.middleware.js';
import { requireEventAccess } from '../middleware/coordinator-scope.middleware.js';
import { validateFormField, validateFormReorder } from '../validators/form.validator.js';

const router = Router({ mergeParams: true });
router.use(requireAuth);
router.use(requireEventAccess('eventId', 'event'));

router.get(
  '/',
  requirePermission('forms.view'),
  getEventFormHandler
);

router.put(
  '/',
  requirePermission('forms.edit'),
  updateFormSettingsHandler
);

router.post(
  '/fields',
  requirePermission('forms.edit'),
  validateFormField,
  addFieldHandler
);

router.put(
  '/fields/:fieldId',
  requirePermission('forms.edit'),
  validateFormField,
  updateFieldHandler
);

router.delete(
  '/fields/:fieldId',
  requirePermission('forms.edit'),
  deleteFieldHandler
);

router.patch(
  '/fields/reorder',
  requirePermission('forms.edit'),
  validateFormReorder,
  reorderFieldsHandler
);

router.patch(
  '/publish',
  requirePermission('forms.publish'),
  publishFormHandler
);

export default router;
