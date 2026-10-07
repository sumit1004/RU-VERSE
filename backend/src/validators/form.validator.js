import { sendError } from '../utils/response.js';

export const validateFormField = (req, res, next) => {
  const {
    label,
    fieldType,
    fieldScope,
    isRequired,
    placeholder,
    description,
    optionsJson,
    displayOrder,
  } = req.body;

  const errors = {};

  // Label
  if (!label || typeof label !== 'string' || !label.trim()) {
    errors.label = 'Field label is required.';
  } else if (label.trim().length > 191) {
    errors.label = 'Field label cannot exceed 191 characters.';
  }

  // Field Type
  const allowedTypes = [
    'TEXT',
    'TEXTAREA',
    'EMAIL',
    'PHONE',
    'NUMBER',
    'DATE',
    'SELECT',
    'RADIO',
    'CHECKBOX',
  ];
  const cleanType = fieldType ? String(fieldType).toUpperCase() : 'TEXT';
  if (!allowedTypes.includes(cleanType)) {
    errors.fieldType = `Field type must be one of: ${allowedTypes.join(', ')}`;
  }

  // Field Scope
  const allowedScopes = ['REGISTRATION', 'PARTICIPANT'];
  const cleanScope = fieldScope ? String(fieldScope).toUpperCase() : 'PARTICIPANT';
  if (!allowedScopes.includes(cleanScope)) {
    errors.fieldScope = 'Field scope must be REGISTRATION or PARTICIPANT.';
  }

  // Options validation for SELECT and RADIO
  let cleanOptions = null;
  if (cleanType === 'SELECT' || cleanType === 'RADIO') {
    if (!optionsJson) {
      errors.optionsJson = `Options are required for ${cleanType} field type.`;
    } else {
      let parsed = optionsJson;
      if (typeof optionsJson === 'string') {
        try {
          parsed = JSON.parse(optionsJson);
        } catch {
          // split by newline if plain string
          parsed = optionsJson.split('\n').map((s) => s.trim()).filter(Boolean);
        }
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        errors.optionsJson = `At least one option is required for ${cleanType} fields.`;
      } else {
        // Normalize array of strings or { label, value }
        cleanOptions = parsed.map((item) => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object' && item.label) return String(item.label).trim();
          return String(item).trim();
        }).filter(Boolean);

        if (cleanOptions.length === 0) {
          errors.optionsJson = `At least one non-empty option is required for ${cleanType} fields.`;
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'Form field validation failed.', 422, errors);
  }

  req.body.label = label.trim();
  req.body.fieldType = cleanType;
  req.body.fieldScope = cleanScope;
  req.body.isRequired = Boolean(isRequired);
  req.body.placeholder = placeholder ? String(placeholder).trim() : null;
  req.body.description = description ? String(description).trim() : null;
  req.body.optionsJson = cleanOptions;
  if (displayOrder !== undefined) {
    req.body.displayOrder = parseInt(displayOrder, 10) || 0;
  }

  next();
};

export const validateFormReorder = (req, res, next) => {
  const { fieldOrders } = req.body;
  if (!Array.isArray(fieldOrders) || fieldOrders.length === 0) {
    return sendError(res, 'fieldOrders array is required for reordering.', 422, {
      fieldOrders: 'fieldOrders must be a non-empty array of { id, displayOrder } objects.',
    });
  }

  for (const item of fieldOrders) {
    if (!item.id || item.displayOrder === undefined) {
      return sendError(res, 'Each item in fieldOrders must contain id and displayOrder.', 422);
    }
  }

  next();
};
