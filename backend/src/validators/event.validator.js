import { sendError } from '../utils/response.js';

export const validateEvent = (req, res, next) => {
  const {
    title,
    shortDescription,
    description,
    categoryId,
    venue,
    startDateTime,
    endDateTime,
    registrationStart,
    registrationEnd,
    registrationType,
    teamMinSize,
    teamMaxSize,
    registrationLimit,
    displayOrder,
    isFeatured,
    isOpenForAll,
    isActive,
    isPublished,
    registrationMode,
    registrationLink,
  } = req.body;

  const errors = {};

  // Title
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.title = 'Event title is required.';
  } else if (title.trim().length < 3) {
    errors.title = 'Event title must be at least 3 characters.';
  } else if (title.trim().length > 191) {
    errors.title = 'Event title cannot exceed 191 characters.';
  }

  // Description
  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.description = 'Event description is required.';
  }

  // Category
  const parsedCategoryId = parseInt(categoryId, 10);
  if (!categoryId || isNaN(parsedCategoryId)) {
    errors.categoryId = 'A valid category must be selected.';
  }

  // Venue
  if (!venue || typeof venue !== 'string' || !venue.trim()) {
    errors.venue = 'Event venue / location is required.';
  }

  // Dates
  const startDate = startDateTime ? new Date(startDateTime) : null;
  const endDate = endDateTime ? new Date(endDateTime) : null;
  const regStartDate = registrationStart ? new Date(registrationStart) : null;
  const regEndDate = registrationEnd ? new Date(registrationEnd) : null;

  if (!startDate || isNaN(startDate.getTime())) {
    errors.startDateTime = 'Valid event start date and time is required.';
  }
  if (!endDate || isNaN(endDate.getTime())) {
    errors.endDateTime = 'Valid event end date and time is required.';
  }
  if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
    if (endDate < startDate) {
      errors.endDateTime = 'Event end time must be after start time.';
    }
  }

  if (!regStartDate || isNaN(regStartDate.getTime())) {
    errors.registrationStart = 'Valid registration start date and time is required.';
  }
  if (!regEndDate || isNaN(regEndDate.getTime())) {
    errors.registrationEnd = 'Valid registration end date and time is required.';
  }
  if (regStartDate && regEndDate && !isNaN(regStartDate.getTime()) && !isNaN(regEndDate.getTime())) {
    if (regEndDate < regStartDate) {
      errors.registrationEnd = 'Registration end time must be after registration start time.';
    }
  }

  // Registration Type
  const validTypes = ['INDIVIDUAL', 'TEAM', 'BOTH'];
  const cleanRegType = registrationType ? String(registrationType).toUpperCase() : 'INDIVIDUAL';
  if (!validTypes.includes(cleanRegType)) {
    errors.registrationType = 'Registration type must be INDIVIDUAL, TEAM, or BOTH.';
  }

  // Team settings if TEAM or BOTH
  let cleanMinSize = null;
  let cleanMaxSize = null;

  if (cleanRegType === 'TEAM' || cleanRegType === 'BOTH') {
    const min = parseInt(teamMinSize, 10);
    const max = parseInt(teamMaxSize, 10);

    if (isNaN(min) || min < 1) {
      errors.teamMinSize = 'Minimum team size must be at least 1.';
    } else {
      cleanMinSize = min;
    }

    if (isNaN(max) || max < (cleanMinSize || 1)) {
      errors.teamMaxSize = 'Maximum team size must be greater than or equal to minimum team size.';
    } else {
      cleanMaxSize = max;
    }
  }

  // Registration Limit
  let cleanRegLimit = null;
  if (registrationLimit !== undefined && registrationLimit !== null && registrationLimit !== '') {
    const limit = parseInt(registrationLimit, 10);
    if (isNaN(limit) || limit < 1) {
      errors.registrationLimit = 'Registration limit must be a positive number.';
    } else {
      cleanRegLimit = limit;
    }
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'Validation failed for event data.', 422, errors);
  }

  // Sanitize cleaned values on request body
  req.body.title = title.trim();
  req.body.shortDescription = shortDescription ? String(shortDescription).trim().slice(0, 255) : null;
  req.body.description = description.trim();
  req.body.categoryId = parsedCategoryId;
  req.body.venue = venue.trim();
  req.body.startDateTime = startDate;
  req.body.endDateTime = endDate;
  req.body.registrationStart = regStartDate;
  req.body.registrationEnd = regEndDate;
  req.body.registrationType = cleanRegType;
  req.body.teamMinSize = cleanMinSize;
  req.body.teamMaxSize = cleanMaxSize;
  req.body.registrationLimit = cleanRegLimit;
  req.body.displayOrder = displayOrder !== undefined ? parseInt(displayOrder, 10) || 0 : (req.method === 'POST' ? 0 : undefined);
  
  if (isFeatured !== undefined) req.body.isFeatured = Boolean(isFeatured);
  else if (req.method === 'POST') req.body.isFeatured = false;

  if (isOpenForAll !== undefined) req.body.isOpenForAll = Boolean(isOpenForAll);
  else if (req.method === 'POST') req.body.isOpenForAll = true;

  if (isActive !== undefined) req.body.isActive = Boolean(isActive);
  else if (req.method === 'POST') req.body.isActive = true;

  if (isPublished !== undefined) req.body.isPublished = Boolean(isPublished);
  else if (req.method === 'POST') req.body.isPublished = false;

  const validModes = ['INTERNAL', 'EXTERNAL'];
  if (registrationMode !== undefined) {
    const cleanMode = String(registrationMode).toUpperCase();
    if (!validModes.includes(cleanMode)) {
      errors.registrationMode = 'Registration mode must be INTERNAL or EXTERNAL.';
    } else {
      req.body.registrationMode = cleanMode;
    }
  } else if (req.method === 'POST') {
    req.body.registrationMode = 'INTERNAL';
  }

  if (registrationLink !== undefined) {
    req.body.registrationLink = registrationLink ? String(registrationLink).trim() : null;
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 'Validation failed for event data.', 422, errors);
  }

  next();
};
