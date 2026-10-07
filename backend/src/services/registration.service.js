import { prisma } from '../config/database.js';
import { generateRegistrationNumber } from '../utils/registration-number.js';
import { createAuditLog } from './audit.service.js';

/**
 * Get public event registration details and published dynamic form
 */
export const getPublicRegistrationData = async (slug) => {
  const event = await prisma.event.findFirst({
    where: {
      slug: String(slug).trim(),
      isPublished: true,
      isActive: true,
      archivedAt: null,
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      registrationForm: {
        include: {
          fields: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
      },
    },
  });

  if (!event) {
    const error = new Error('Event not found or registration is unavailable.');
    error.statusCode = 404;
    throw error;
  }

  const form = event.registrationForm;
  if (!form || form.status !== 'PUBLISHED') {
    const error = new Error('Registration form is not yet published for this event.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const regStart = new Date(event.registrationStart);
  const regEnd = new Date(event.registrationEnd);

  // Calculate active registrations count for capacity
  const activeCount = await prisma.registration.count({
    where: {
      eventId: event.id,
      status: { in: ['PENDING', 'CONFIRMED', 'WAITLISTED'] },
    },
  });

  let status = 'OPEN';
  let message = 'Registration is open';

  if (now < regStart) {
    status = 'UPCOMING';
    message = 'Registration has not started yet.';
  } else if (now > regEnd) {
    status = 'CLOSED';
    message = 'Registration for this event has closed.';
  } else if (event.registrationLimit && activeCount >= event.registrationLimit) {
    status = 'FULL';
    message = 'Registration capacity for this event has been reached.';
  }

  const remainingSpots = event.registrationLimit ? Math.max(0, event.registrationLimit - activeCount) : null;

  return {
    event: {
      id: event.id,
      title: event.title,
      slug: event.slug,
      shortDescription: event.shortDescription,
      venue: event.venue,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      registrationStart: event.registrationStart,
      registrationEnd: event.registrationEnd,
      registrationMode: event.registrationMode,
      registrationLink: event.registrationLink,
      registrationType: event.registrationType,
      teamMinSize: event.teamMinSize,
      teamMaxSize: event.teamMaxSize,
      registrationLimit: event.registrationLimit,
      category: event.category,
    },
    availability: {
      status,
      isOpen: status === 'OPEN',
      message,
      activeRegistrations: activeCount,
      remainingSpots,
      serverTime: now.toISOString(),
    },
    form: {
      id: form.id,
      version: form.version,
      title: form.title,
      description: form.description,
      fields: form.fields.map((f) => ({
        id: f.id,
        label: f.label,
        fieldKey: f.fieldKey,
        fieldType: f.fieldType,
        description: f.description,
        placeholder: f.placeholder,
        isRequired: f.isRequired,
        fieldScope: f.fieldScope,
        displayOrder: f.displayOrder,
        optionsJson: f.optionsJson,
        validationJson: f.validationJson,
        isFixed: f.isFixed,
      })),
    },
  };
};

/**
 * Submit public event registration atomically
 */
export const submitPublicRegistration = async (slug, payload) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch Event with published form and active fields
    const event = await tx.event.findFirst({
      where: {
        slug: String(slug).trim(),
        isPublished: true,
        isActive: true,
        archivedAt: null,
      },
      include: {
        registrationForm: {
          include: {
            fields: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!event) {
      const error = new Error('Event not found or unavailable for registration.');
      error.statusCode = 404;
      throw error;
    }

    const form = event.registrationForm;
    if (!form || form.status !== 'PUBLISHED') {
      const error = new Error('Registration form is not currently active for this event.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Server-authoritative time check
    const now = new Date();
    const regStart = new Date(event.registrationStart);
    const regEnd = new Date(event.registrationEnd);

    if (now < regStart) {
      const error = new Error('Registration has not started yet.');
      error.statusCode = 409;
      error.code = 'REGISTRATION_NOT_STARTED';
      throw error;
    }

    if (now > regEnd) {
      const error = new Error('Registration for this event has closed.');
      error.statusCode = 409;
      error.code = 'REGISTRATION_CLOSED';
      throw error;
    }

    // 3. Form Version Check
    if (payload.formVersion && payload.formVersion !== form.version) {
      const error = new Error('The registration form has been updated. Please refresh the page and try again.');
      error.statusCode = 409;
      error.code = 'FORM_VERSION_OUTDATED';
      throw error;
    }

    // 4. Capacity Check
    const activeRegistrationsCount = await tx.registration.count({
      where: {
        eventId: event.id,
        status: { in: ['PENDING', 'CONFIRMED', 'WAITLISTED'] },
      },
    });

    if (event.registrationLimit && activeRegistrationsCount >= event.registrationLimit) {
      const error = new Error('Registration capacity for this event has been reached.');
      error.statusCode = 409;
      error.code = 'REGISTRATION_FULL';
      throw error;
    }

    // 5. Registration Type & Team Validations
    const regType = payload.registrationType;
    const participants = payload.participants || [];

    if (event.registrationType === 'INDIVIDUAL' && regType !== 'INDIVIDUAL') {
      const error = new Error('This event only supports Individual registration.');
      error.statusCode = 422;
      throw error;
    }

    if (event.registrationType === 'TEAM' && regType !== 'TEAM') {
      const error = new Error('This event requires Team registration.');
      error.statusCode = 422;
      throw error;
    }

    if (regType === 'INDIVIDUAL') {
      if (participants.length !== 1) {
        const error = new Error('Individual registration must contain exactly 1 participant.');
        error.statusCode = 422;
        throw error;
      }
    } else if (regType === 'TEAM') {
      const minSize = event.teamMinSize || 2;
      const maxSize = event.teamMaxSize || 5;

      if (!payload.teamName || !payload.teamName.trim()) {
        const error = new Error('Team name is required for team registrations.');
        error.statusCode = 422;
        error.field = 'teamName';
        throw error;
      }

      if (participants.length < minSize) {
        const error = new Error(`Team must have at least ${minSize} participants.`);
        error.statusCode = 422;
        throw error;
      }

      if (participants.length > maxSize) {
        const error = new Error(`Team cannot exceed ${maxSize} participants.`);
        error.statusCode = 422;
        throw error;
      }

      // Check duplicate team name for this event
      const existingTeam = await tx.registration.findFirst({
        where: {
          eventId: event.id,
          teamName: payload.teamName.trim(),
          status: { in: ['PENDING', 'CONFIRMED', 'WAITLISTED'] },
        },
      });

      if (existingTeam) {
        const error = new Error(`A team named "${payload.teamName.trim()}" is already registered for this event.`);
        error.statusCode = 409;
        error.code = 'TEAM_NAME_EXISTS';
        error.field = 'teamName';
        throw error;
      }
    }

    // 6. Participant Email Duplication Checks
    const participantEmails = participants.map((p) => p.fixed.email.trim().toLowerCase());
    if (new Set(participantEmails).size !== participantEmails.length) {
      const error = new Error('Duplicate participant email addresses found in the submitted form.');
      error.statusCode = 422;
      error.code = 'DUPLICATE_PARTICIPANTS';
      throw error;
    }

    // Check if any participant email is already in an active registration for THIS event
    const existingActiveParticipants = await tx.participant.findMany({
      where: {
        email: { in: participantEmails },
        registration: {
          eventId: event.id,
          status: { in: ['PENDING', 'CONFIRMED', 'WAITLISTED'] },
        },
      },
      select: {
        email: true,
        fullName: true,
      },
    });

    if (existingActiveParticipants.length > 0) {
      const duplicateEmail = existingActiveParticipants[0].email;
      const error = new Error(`Participant with email "${duplicateEmail}" is already registered for this event.`);
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_REGISTERED';
      error.field = `email`;
      throw error;
    }

    // 7. Validate Dynamic Form Fields Against Schema Definition
    const registrationFieldsDef = form.fields.filter((f) => f.fieldScope === 'REGISTRATION');
    const participantFieldsDef = form.fields.filter((f) => f.fieldScope === 'PARTICIPANT');

    // Validate registration-level fields
    for (const field of registrationFieldsDef) {
      const val = payload.registrationFields ? payload.registrationFields[field.fieldKey] : undefined;
      if (field.isRequired && (val === undefined || val === null || String(val).trim() === '')) {
        const error = new Error(`Registration field "${field.label}" is required.`);
        error.statusCode = 422;
        error.field = `registrationFields.${field.fieldKey}`;
        throw error;
      }

      // Check SELECT / RADIO options
      if (val && (field.fieldType === 'SELECT' || field.fieldType === 'RADIO') && Array.isArray(field.optionsJson)) {
        if (!field.optionsJson.includes(String(val))) {
          const error = new Error(`Invalid selection for "${field.label}".`);
          error.statusCode = 422;
          error.field = `registrationFields.${field.fieldKey}`;
          throw error;
        }
      }
    }

    // Validate participant-level custom fields
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      for (const field of participantFieldsDef) {
        if (!field.isFixed) {
          const val = p.custom ? p.custom[field.fieldKey] : undefined;
          if (field.isRequired && (val === undefined || val === null || String(val).trim() === '')) {
            const error = new Error(`Participant ${i + 1}: "${field.label}" is required.`);
            error.statusCode = 422;
            error.field = `participants.${i}.custom.${field.fieldKey}`;
            throw error;
          }

          if (val && (field.fieldType === 'SELECT' || field.fieldType === 'RADIO') && Array.isArray(field.optionsJson)) {
            if (!field.optionsJson.includes(String(val))) {
              const error = new Error(`Participant ${i + 1}: Invalid option for "${field.label}".`);
              error.statusCode = 422;
              error.field = `participants.${i}.custom.${field.fieldKey}`;
              throw error;
            }
          }
        }
      }
    }

    // 8. Generate Unique Registration Number
    let registrationNumber = generateRegistrationNumber();
    let collisionAttempts = 0;
    while (collisionAttempts < 5) {
      const existing = await tx.registration.findUnique({
        where: { registrationNumber },
        select: { id: true },
      });
      if (!existing) break;
      registrationNumber = generateRegistrationNumber();
      collisionAttempts++;
    }

    // 9. Create Registration Record
    const registration = await tx.registration.create({
      data: {
        registrationNumber,
        eventId: event.id,
        formId: form.id,
        formVersion: form.version,
        registrationType: regType,
        teamName: regType === 'TEAM' ? payload.teamName.trim() : null,
        status: 'CONFIRMED',
        submittedAt: now,
      },
    });

    // 10. Create Participants and Snapshot Custom Participant Fields
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const participantRecord = await tx.participant.create({
        data: {
          registrationId: registration.id,
          fullName: p.fixed.fullName.trim(),
          email: p.fixed.email.trim().toLowerCase(),
          mobile: p.fixed.mobile.trim(),
          college: p.fixed.college.trim(),
          participantOrder: i + 1,
        },
      });

      // Snapshot participant custom fields
      for (const field of participantFieldsDef) {
        if (!field.isFixed) {
          const val = p.custom ? p.custom[field.fieldKey] : undefined;
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            await tx.participantFieldValue.create({
              data: {
                participantId: participantRecord.id,
                fieldId: field.id,
                fieldKey: field.fieldKey,
                fieldLabel: field.label,
                value: typeof val === 'object' ? JSON.stringify(val) : String(val),
              },
            });
          }
        }
      }
    }

    // 11. Create Registration-level Field Values Snapshot
    for (const field of registrationFieldsDef) {
      const val = payload.registrationFields ? payload.registrationFields[field.fieldKey] : undefined;
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        await tx.registrationFieldValue.create({
          data: {
            registrationId: registration.id,
            fieldId: field.id,
            fieldKey: field.fieldKey,
            fieldLabel: field.label,
            value: typeof val === 'object' ? JSON.stringify(val) : String(val),
          },
        });
      }
    }

    return {
      registrationNumber: registration.registrationNumber,
      eventId: event.id,
      eventTitle: event.title,
      eventSlug: event.slug,
      registrationType: registration.registrationType,
      teamName: registration.teamName,
      participantCount: participants.length,
      submittedAt: registration.submittedAt,
    };
  });
};

/**
 * Get paginated registrations for admin with filters and search
 */
export const getAdminRegistrations = async ({
  eventId,
  status,
  registrationType,
  search,
  from,
  to,
  page = 1,
  limit = 25,
  sortBy = 'submittedAt',
  sortOrder = 'desc',
  coordinatorUserId = null,
} = {}) => {
  const whereClause = {};

  if (coordinatorUserId) {
    whereClause.event = {
      coordinators: {
        some: { userId: coordinatorUserId },
      },
    };
  }

  if (eventId) {
    const parsedId = parseInt(eventId, 10);
    if (!isNaN(parsedId)) {
      whereClause.eventId = parsedId;
    }
  }

  if (status) {
    whereClause.status = status;
  }

  if (registrationType) {
    whereClause.registrationType = registrationType;
  }

  if (from || to) {
    whereClause.submittedAt = {};
    if (from) whereClause.submittedAt.gte = new Date(from);
    if (to) whereClause.submittedAt.lte = new Date(to);
  }

  if (search && search.trim()) {
    const term = search.trim();
    whereClause.OR = [
      { registrationNumber: { contains: term } },
      { teamName: { contains: term } },
      {
        participants: {
          some: {
            OR: [
              { fullName: { contains: term } },
              { email: { contains: term } },
              { college: { contains: term } },
            ],
          },
        },
      },
    ];
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
  const skip = (parsedPage - 1) * parsedLimit;

  // Order
  const allowedSorts = ['submittedAt', 'registrationNumber', 'teamName', 'status'];
  const validSortBy = allowedSorts.includes(sortBy) ? sortBy : 'submittedAt';
  const validSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

  const [total, items] = await Promise.all([
    prisma.registration.count({ where: whereClause }),
    prisma.registration.findMany({
      where: whereClause,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            venue: true,
            registrationLimit: true,
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        participants: {
          orderBy: { participantOrder: 'asc' },
        },
      },
      orderBy: { [validSortBy]: validSortOrder },
      skip,
      take: parsedLimit,
    }),
  ]);

  // Real summary counts
  const summaryWhere = eventId ? { eventId: parseInt(eventId, 10) } : {};
  const [confirmedCount, pendingCount, cancelledCount, rejectedCount] = await Promise.all([
    prisma.registration.count({ where: { ...summaryWhere, status: 'CONFIRMED' } }),
    prisma.registration.count({ where: { ...summaryWhere, status: 'PENDING' } }),
    prisma.registration.count({ where: { ...summaryWhere, status: 'CANCELLED' } }),
    prisma.registration.count({ where: { ...summaryWhere, status: 'REJECTED' } }),
  ]);

  return {
    items,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
    summary: {
      total,
      confirmed: confirmedCount,
      pending: pendingCount,
      cancelled: cancelledCount,
      rejected: rejectedCount,
    },
  };
};

/**
 * Get detailed registration record by ID
 */
export const getRegistrationById = async (id) => {
  const regId = parseInt(id, 10);
  let where = isNaN(regId) ? { registrationNumber: String(id).trim() } : { id: regId };

  const registration = await prisma.registration.findUnique({
    where,
    include: {
      event: {
        include: {
          category: true,
        },
      },
      form: {
        select: {
          id: true,
          title: true,
          version: true,
          status: true,
        },
      },
      participants: {
        orderBy: { participantOrder: 'asc' },
        include: {
          fieldValues: {
            orderBy: { id: 'asc' },
          },
        },
      },
      fieldValues: {
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!registration) {
    const error = new Error('Registration record not found.');
    error.statusCode = 404;
    throw error;
  }

  return registration;
};

/**
 * Update registration status (Admin)
 */
export const updateRegistrationStatus = async (id, status, notes = null, userId = null) => {
  const regId = parseInt(id, 10);
  if (isNaN(regId)) {
    const error = new Error('Invalid registration ID.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.registration.findUnique({
    where: { id: regId },
  });

  if (!existing) {
    const error = new Error('Registration record not found.');
    error.statusCode = 404;
    throw error;
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'WAITLISTED'];
  if (!validStatuses.includes(status)) {
    const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const updateData = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'CANCELLED' && existing.status !== 'CANCELLED') {
    updateData.cancelledAt = new Date();
  } else if (status !== 'CANCELLED' && existing.cancelledAt) {
    updateData.cancelledAt = null;
  }

  return await prisma.registration.update({
    where: { id: regId },
    data: updateData,
    include: {
      event: { select: { id: true, title: true, slug: true } },
      participants: { orderBy: { participantOrder: 'asc' } },
    },
  });
};

/**
 * Get registration summary for a specific event
 */
export const getEventRegistrationSummary = async (eventId) => {
  const parsedId = parseInt(eventId, 10);
  if (isNaN(parsedId)) {
    const error = new Error('Invalid event ID.');
    error.statusCode = 400;
    throw error;
  }

  const event = await prisma.event.findUnique({
    where: { id: parsedId },
    select: {
      id: true,
      title: true,
      slug: true,
      registrationLimit: true,
      registrationStart: true,
      registrationEnd: true,
    },
  });

  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  const [total, confirmed, pending, cancelled, rejected] = await Promise.all([
    prisma.registration.count({ where: { eventId: parsedId } }),
    prisma.registration.count({ where: { eventId: parsedId, status: 'CONFIRMED' } }),
    prisma.registration.count({ where: { eventId: parsedId, status: 'PENDING' } }),
    prisma.registration.count({ where: { eventId: parsedId, status: 'CANCELLED' } }),
    prisma.registration.count({ where: { eventId: parsedId, status: 'REJECTED' } }),
  ]);

  const activeCount = confirmed + pending;
  const remaining = event.registrationLimit ? Math.max(0, event.registrationLimit - activeCount) : null;

  return {
    event,
    counts: {
      total,
      confirmed,
      pending,
      cancelled,
      rejected,
      active: activeCount,
      capacity: event.registrationLimit,
      remainingSpots: remaining,
    },
  };
};

/**
 * Export registrations to CSV with coordinator event scoping and audit trail
 */
export const exportRegistrations = async ({
  eventId,
  status,
  registrationType,
  from,
  to,
  user,
  req = null,
}) => {
  const whereClause = {};

  if (user && user.role?.slug === 'coordinator') {
    // Check assigned events
    const assignedCoords = await prisma.eventCoordinator.findMany({
      where: { userId: user.id },
      select: { eventId: true },
    });
    const assignedIds = assignedCoords.map((c) => c.eventId);

    if (eventId) {
      const parsedId = parseInt(eventId, 10);
      if (!assignedIds.includes(parsedId)) {
        const error = new Error('You are not authorized to export registrations for this unassigned event.');
        error.statusCode = 403;
        throw error;
      }
      whereClause.eventId = parsedId;
    } else {
      whereClause.eventId = { in: assignedIds };
    }
  } else if (eventId) {
    const parsedId = parseInt(eventId, 10);
    if (!isNaN(parsedId)) {
      whereClause.eventId = parsedId;
    }
  }

  if (status && status !== 'ALL') {
    whereClause.status = status;
  }

  if (registrationType && registrationType !== 'ALL') {
    whereClause.registrationType = registrationType;
  }

  if (from || to) {
    whereClause.submittedAt = {};
    if (from) whereClause.submittedAt.gte = new Date(from);
    if (to) whereClause.submittedAt.lte = new Date(to);
  }

  const registrations = await prisma.registration.findMany({
    where: whereClause,
    include: {
      event: { select: { id: true, title: true, slug: true } },
      participants: { orderBy: { participantOrder: 'asc' } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  // Generate CSV rows
  const headers = [
    'Registration Number',
    'Event Title',
    'Registration Type',
    'Team Name',
    'Status',
    'Leader Name',
    'Leader Email',
    'Leader Mobile',
    'Leader College',
    'Participants Count',
    'Submitted At',
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = [headers.join(',')];

  for (const reg of registrations) {
    const leader = reg.participants[0] || {};
    const row = [
      escapeCsv(reg.registrationNumber),
      escapeCsv(reg.event?.title || ''),
      escapeCsv(reg.registrationType),
      escapeCsv(reg.teamName || 'N/A'),
      escapeCsv(reg.status),
      escapeCsv(leader.fullName || ''),
      escapeCsv(leader.email || ''),
      escapeCsv(leader.mobile || ''),
      escapeCsv(leader.college || ''),
      escapeCsv(reg.participants.length),
      escapeCsv(reg.submittedAt ? new Date(reg.submittedAt).toISOString() : ''),
    ];
    rows.push(row.join(','));
  }

  const csvContent = rows.join('\n');

  // Emit Audit Log
  await createAuditLog({
    actorUserId: user?.id || null,
    action: 'EXPORT_GENERATED',
    entityType: 'REGISTRATION',
    eventId: eventId ? parseInt(eventId, 10) : null,
    metadata: {
      eventId: eventId || 'ALL',
      status: status || 'ALL',
      registrationType: registrationType || 'ALL',
      rowCount: registrations.length,
    },
    req,
  });

  return {
    csvContent,
    rowCount: registrations.length,
  };
};

