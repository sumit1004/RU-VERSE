import { prisma } from '../config/database.js';
import { slugify } from './category.service.js';

/**
 * Calculate real-time registration status based on event dates and publication state
 */
export const calculateRegistrationStatus = (event) => {
  if (event.archivedAt) {
    return 'ARCHIVED';
  }
  if (!event.isPublished) {
    return 'DRAFT';
  }
  if (!event.isActive) {
    return 'INACTIVE';
  }

  const now = new Date();
  const regStart = new Date(event.registrationStart);
  const regEnd = new Date(event.registrationEnd);

  if (now < regStart) {
    return 'UPCOMING';
  }
  if (now > regEnd) {
    return 'CLOSED';
  }
  return 'OPEN';
};

/**
 * Generate a unique slug for an event, appending -2, -3 if duplicate exists
 */
export const generateUniqueEventSlug = async (title, currentEventId = null) => {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.event.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || (currentEventId && existing.id === currentEventId)) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
};

/**
 * Get public active, published, and non-archived events
 */
export const getPublicEvents = async ({ categorySlug = null, search = null } = {}) => {
  const whereClause = {
    isPublished: true,
    isActive: true,
    archivedAt: null,
  };

  if (categorySlug) {
    whereClause.category = {
      slug: categorySlug,
      isActive: true,
    };
  }

  if (search && search.trim()) {
    whereClause.OR = [
      { title: { contains: search.trim() } },
      { shortDescription: { contains: search.trim() } },
      { venue: { contains: search.trim() } },
    ];
  }

  const events = await prisma.event.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      description: true,
      venue: true,
      startDateTime: true,
      endDateTime: true,
      registrationStart: true,
      registrationEnd: true,
      registrationMode: true,
      registrationLink: true,
      registrationType: true,
      teamMinSize: true,
      teamMaxSize: true,
      isFeatured: true,
      isOpenForAll: true,
      displayOrder: true,
      registrationLimit: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [
      { isFeatured: 'desc' },
      { displayOrder: 'asc' },
      { startDateTime: 'asc' },
    ],
  });

  return events.map((event) => ({
    ...event,
    registrationStatus: calculateRegistrationStatus(event),
  }));
};

/**
 * Get single public event by slug
 */
export const getPublicEventBySlug = async (slug) => {
  const event = await prisma.event.findFirst({
    where: {
      slug: String(slug).trim(),
      isPublished: true,
      isActive: true,
      archivedAt: null,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      description: true,
      venue: true,
      startDateTime: true,
      endDateTime: true,
      registrationStart: true,
      registrationEnd: true,
      registrationMode: true,
      registrationLink: true,
      registrationType: true,
      teamMinSize: true,
      teamMaxSize: true,
      isFeatured: true,
      isOpenForAll: true,
      displayOrder: true,
      registrationLimit: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!event) return null;

  return {
    ...event,
    registrationStatus: calculateRegistrationStatus(event),
  };
};

/**
 * Get admin events list with rich filtering, search, and pagination
 */
export const getAdminEvents = async ({
  search,
  categoryId,
  status,
  registrationType,
  isFeatured,
  isOpenForAll,
  includeArchived = false,
} = {}) => {
  const whereClause = {};

  if (!includeArchived) {
    whereClause.archivedAt = null;
  }

  if (search && search.trim()) {
    whereClause.OR = [
      { title: { contains: search.trim() } },
      { slug: { contains: search.trim() } },
      { venue: { contains: search.trim() } },
    ];
  }

  if (categoryId) {
    const parsedCat = parseInt(categoryId, 10);
    if (!isNaN(parsedCat)) {
      whereClause.categoryId = parsedCat;
    }
  }

  if (registrationType) {
    whereClause.registrationType = registrationType;
  }

  if (isFeatured !== undefined && isFeatured !== null) {
    whereClause.isFeatured = isFeatured === 'true' || isFeatured === true;
  }

  if (isOpenForAll !== undefined && isOpenForAll !== null) {
    whereClause.isOpenForAll = isOpenForAll === 'true' || isOpenForAll === true;
  }

  if (status) {
    const s = String(status).toUpperCase();
    if (s === 'PUBLISHED') {
      whereClause.isPublished = true;
      whereClause.isActive = true;
      whereClause.archivedAt = null;
    } else if (s === 'DRAFT') {
      whereClause.isPublished = false;
      whereClause.archivedAt = null;
    } else if (s === 'ARCHIVED') {
      whereClause.archivedAt = { not: null };
    } else if (s === 'INACTIVE') {
      whereClause.isActive = false;
      whereClause.archivedAt = null;
    }
  }

  const events = await prisma.event.findMany({
    where: whereClause,
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      updater: {
        select: { id: true, name: true, email: true },
      },
      registrationForm: {
        select: {
          id: true,
          status: true,
          version: true,
          _count: { select: { fields: true } },
        },
      },
    },
    orderBy: [
      { isFeatured: 'desc' },
      { displayOrder: 'asc' },
      { startDateTime: 'asc' },
    ],
  });

  return events.map((ev) => ({
    ...ev,
    registrationStatus: calculateRegistrationStatus(ev),
  }));
};

/**
 * Get detailed event by ID for admin
 */
export const getEventById = async (id) => {
  const eventId = parseInt(id, 10);
  if (isNaN(eventId)) return null;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      category: true,
      creator: {
        select: { id: true, name: true, email: true },
      },
      updater: {
        select: { id: true, name: true, email: true },
      },
      registrationForm: {
        include: {
          fields: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      },
    },
  });

  if (!event) return null;

  return {
    ...event,
    registrationStatus: calculateRegistrationStatus(event),
  };
};

/**
 * Create a new event
 */
export const createEvent = async (data, userId) => {
  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) {
    const error = new Error('Selected category does not exist.');
    error.statusCode = 404;
    throw error;
  }

  const slug = await generateUniqueEventSlug(data.title);

  return await prisma.event.create({
    data: {
      title: data.title,
      slug,
      shortDescription: data.shortDescription,
      description: data.description,
      categoryId: data.categoryId,
      venue: data.venue,
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      registrationStart: data.registrationStart,
      registrationEnd: data.registrationEnd,
      registrationMode: data.registrationMode || 'INTERNAL',
      registrationLink: data.registrationLink || null,
      registrationType: data.registrationType,
      teamMinSize: data.teamMinSize,
      teamMaxSize: data.teamMaxSize,
      registrationLimit: data.registrationLimit,
      displayOrder: data.displayOrder,
      isFeatured: data.isFeatured,
      isOpenForAll: data.isOpenForAll,
      isActive: data.isActive,
      isPublished: data.isPublished,
      createdById: userId || null,
      updatedById: userId || null,
    },
    include: {
      category: true,
      creator: { select: { id: true, name: true, email: true } },
    },
  });
};

/**
 * Update an existing event
 */
export const updateEvent = async (id, data, userId) => {
  const eventId = parseInt(id, 10);
  if (isNaN(eventId)) {
    const error = new Error('Invalid event ID.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!existing) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  // If category changed, verify it exists
  if (data.categoryId && data.categoryId !== existing.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      const error = new Error('Selected category does not exist.');
      error.statusCode = 404;
      throw error;
    }
  }

  // Preserve slug unless title changed drastically and not yet published,
  // or generate unique slug if changed
  let slug = existing.slug;
  if (data.title && data.title !== existing.title && !existing.isPublished) {
    slug = await generateUniqueEventSlug(data.title, eventId);
  }

  return await prisma.event.update({
    where: { id: eventId },
    data: {
      title: data.title !== undefined ? data.title : existing.title,
      slug,
      shortDescription: data.shortDescription !== undefined ? data.shortDescription : existing.shortDescription,
      description: data.description !== undefined ? data.description : existing.description,
      categoryId: data.categoryId !== undefined ? data.categoryId : existing.categoryId,
      venue: data.venue !== undefined ? data.venue : existing.venue,
      startDateTime: data.startDateTime !== undefined ? data.startDateTime : existing.startDateTime,
      endDateTime: data.endDateTime !== undefined ? data.endDateTime : existing.endDateTime,
      registrationStart: data.registrationStart !== undefined ? data.registrationStart : existing.registrationStart,
      registrationEnd: data.registrationEnd !== undefined ? data.registrationEnd : existing.registrationEnd,
      registrationMode: data.registrationMode !== undefined ? data.registrationMode : existing.registrationMode,
      registrationLink: data.registrationLink !== undefined ? data.registrationLink : existing.registrationLink,
      registrationType: data.registrationType !== undefined ? data.registrationType : existing.registrationType,
      teamMinSize: data.teamMinSize !== undefined ? data.teamMinSize : existing.teamMinSize,
      teamMaxSize: data.teamMaxSize !== undefined ? data.teamMaxSize : existing.teamMaxSize,
      registrationLimit: data.registrationLimit !== undefined ? data.registrationLimit : existing.registrationLimit,
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : existing.displayOrder,
      isFeatured: data.isFeatured !== undefined ? data.isFeatured : existing.isFeatured,
      isOpenForAll: data.isOpenForAll !== undefined ? data.isOpenForAll : existing.isOpenForAll,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      isPublished: data.isPublished !== undefined ? data.isPublished : existing.isPublished,
      updatedById: userId || null,
    },
    include: {
      category: true,
      creator: { select: { id: true, name: true, email: true } },
      updater: { select: { id: true, name: true, email: true } },
      registrationForm: true,
    },
  });
};

/**
 * Toggle or update publish status
 */
export const updateEventPublishStatus = async (id, isPublished, userId) => {
  const eventId = parseInt(id, 10);
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  if (existing.archivedAt && isPublished) {
    const error = new Error('Archived event cannot be published.');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.event.update({
    where: { id: eventId },
    data: {
      isPublished: Boolean(isPublished),
      updatedById: userId || null,
    },
    include: {
      category: true,
    },
  });
};

/**
 * Toggle or update active status
 */
export const updateEventActiveStatus = async (id, isActive, userId) => {
  const eventId = parseInt(id, 10);
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.event.update({
    where: { id: eventId },
    data: {
      isActive: Boolean(isActive),
      updatedById: userId || null,
    },
    include: { category: true },
  });
};

/**
 * Toggle featured flag
 */
export const updateEventFeaturedStatus = async (id, isFeatured, userId) => {
  const eventId = parseInt(id, 10);
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.event.update({
    where: { id: eventId },
    data: {
      isFeatured: Boolean(isFeatured),
      updatedById: userId || null,
    },
    include: { category: true },
  });
};

/**
 * Toggle open for all flag
 */
export const updateEventOpenForAllStatus = async (id, isOpenForAll, userId) => {
  const eventId = parseInt(id, 10);
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.event.update({
    where: { id: eventId },
    data: {
      isOpenForAll: Boolean(isOpenForAll),
      updatedById: userId || null,
    },
    include: { category: true },
  });
};

/**
 * Archive or unarchive event
 */
export const archiveEvent = async (id, shouldArchive = true, userId) => {
  const eventId = parseInt(id, 10);
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.event.update({
    where: { id: eventId },
    data: {
      archivedAt: shouldArchive ? new Date() : null,
      isPublished: shouldArchive ? false : existing.isPublished,
      updatedById: userId || null,
    },
    include: { category: true },
  });
};
