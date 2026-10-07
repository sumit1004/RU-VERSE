import { prisma } from '../config/database.js';
import { slugify } from './category.service.js';

/**
 * Generate a unique field key within a form (e.g. github_profile, github_profile_2)
 */
export const generateUniqueFieldKey = async (label, formId, currentFieldId = null) => {
  const baseKey = slugify(label).replace(/-/g, '_');
  let fieldKey = baseKey || 'field_custom';
  let counter = 1;

  while (true) {
    const existing = await prisma.registrationFormField.findUnique({
      where: {
        formId_fieldKey: {
          formId,
          fieldKey,
        },
      },
    });

    if (!existing || (currentFieldId && existing.id === currentFieldId)) {
      return fieldKey;
    }

    counter++;
    fieldKey = `${baseKey}_${counter}`;
  }
};

/**
 * Get or initialize registration form for an event with baseline participant fields
 */
export const getOrCreateEventForm = async (eventId, userId) => {
  const parsedEventId = parseInt(eventId, 10);
  if (isNaN(parsedEventId)) {
    const error = new Error('Invalid event ID.');
    error.statusCode = 400;
    throw error;
  }

  const event = await prisma.event.findUnique({
    where: { id: parsedEventId },
    include: {
      category: true,
      registrationForm: {
        include: {
          fields: {
            orderBy: { displayOrder: 'asc' },
          },
          creator: { select: { id: true, name: true, email: true } },
          updater: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  // If form already exists, return it
  if (event.registrationForm) {
    return {
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        registrationType: event.registrationType,
        teamMinSize: event.teamMinSize,
        teamMaxSize: event.teamMaxSize,
        category: event.category,
      },
      form: event.registrationForm,
    };
  }

  // If form does not exist, initialize draft form with fixed baseline participant fields in a transaction
  const initialForm = await prisma.$transaction(async (tx) => {
    const newForm = await tx.registrationForm.create({
      data: {
        eventId: parsedEventId,
        title: `${event.title} Registration Form`,
        description: `Official registration form for ${event.title}. Please provide accurate participant details.`,
        status: 'DRAFT',
        version: 1,
        createdById: userId || null,
        updatedById: userId || null,
      },
    });

    const fixedFields = [
      {
        formId: newForm.id,
        label: 'Full Name',
        fieldKey: 'participant_full_name',
        fieldType: 'TEXT',
        placeholder: 'e.g. Alex Morgan',
        description: 'Participant full legal name',
        isRequired: true,
        fieldScope: 'PARTICIPANT',
        displayOrder: 1,
        isFixed: true,
        isActive: true,
      },
      {
        formId: newForm.id,
        label: 'Email Address',
        fieldKey: 'participant_email',
        fieldType: 'EMAIL',
        placeholder: 'name@university.edu',
        description: 'Primary contact and confirmation email',
        isRequired: true,
        fieldScope: 'PARTICIPANT',
        displayOrder: 2,
        isFixed: true,
        isActive: true,
      },
      {
        formId: newForm.id,
        label: 'Mobile Number',
        fieldKey: 'participant_mobile',
        fieldType: 'PHONE',
        placeholder: '+91 98765 43210',
        description: 'WhatsApp/SMS contact for event coordination',
        isRequired: true,
        fieldScope: 'PARTICIPANT',
        displayOrder: 3,
        isFixed: true,
        isActive: true,
      },
      {
        formId: newForm.id,
        label: 'College / University',
        fieldKey: 'participant_college',
        fieldType: 'TEXT',
        placeholder: 'University or Institution Name',
        description: 'Current institution of study',
        isRequired: true,
        fieldScope: 'PARTICIPANT',
        displayOrder: 4,
        isFixed: true,
        isActive: true,
      },
    ];

    await tx.registrationFormField.createMany({
      data: fixedFields,
    });

    return await tx.registrationForm.findUnique({
      where: { id: newForm.id },
      include: {
        fields: {
          orderBy: { displayOrder: 'asc' },
        },
        creator: { select: { id: true, name: true, email: true } },
        updater: { select: { id: true, name: true, email: true } },
      },
    });
  });

  return {
    event: {
      id: event.id,
      title: event.title,
      slug: event.slug,
      registrationType: event.registrationType,
      teamMinSize: event.teamMinSize,
      teamMaxSize: event.teamMaxSize,
      category: event.category,
    },
    form: initialForm,
  };
};

/**
 * Update form general settings (title, description)
 */
export const updateFormSettings = async (eventId, { title, description }, userId) => {
  const { form } = await getOrCreateEventForm(eventId, userId);

  return await prisma.registrationForm.update({
    where: { id: form.id },
    data: {
      title: title !== undefined ? String(title).trim() : form.title,
      description: description !== undefined ? String(description).trim() : form.description,
      updatedById: userId || null,
    },
    include: {
      fields: { orderBy: { displayOrder: 'asc' } },
    },
  });
};

/**
 * Add a custom field to the event registration form
 */
export const addFieldToForm = async (eventId, fieldData, userId) => {
  const { form } = await getOrCreateEventForm(eventId, userId);

  const fieldKey = await generateUniqueFieldKey(fieldData.label, form.id);

  // Determine highest display order
  const highestOrderField = await prisma.registrationFormField.findFirst({
    where: { formId: form.id },
    orderBy: { displayOrder: 'desc' },
    select: { displayOrder: true },
  });
  const nextOrder = (highestOrderField?.displayOrder || 0) + 1;

  const newField = await prisma.registrationFormField.create({
    data: {
      formId: form.id,
      label: fieldData.label,
      fieldKey,
      fieldType: fieldData.fieldType,
      description: fieldData.description || null,
      placeholder: fieldData.placeholder || null,
      isRequired: Boolean(fieldData.isRequired),
      fieldScope: fieldData.fieldScope,
      displayOrder: fieldData.displayOrder !== undefined ? fieldData.displayOrder : nextOrder,
      optionsJson: fieldData.optionsJson || null,
      isFixed: false,
      isActive: true,
    },
  });

  // Track updater on parent form
  await prisma.registrationForm.update({
    where: { id: form.id },
    data: { updatedById: userId || null },
  });

  return newField;
};

/**
 * Update an existing field in the form
 */
export const updateFormField = async (eventId, fieldId, fieldData, userId) => {
  const { form } = await getOrCreateEventForm(eventId, userId);

  const parsedFieldId = parseInt(fieldId, 10);
  if (isNaN(parsedFieldId)) {
    const error = new Error('Invalid field ID.');
    error.statusCode = 400;
    throw error;
  }

  const existingField = await prisma.registrationFormField.findFirst({
    where: {
      id: parsedFieldId,
      formId: form.id,
    },
  });

  if (!existingField) {
    const error = new Error('Form field not found in this event form.');
    error.statusCode = 404;
    throw error;
  }

  // If field is fixed, protect its core identity
  if (existingField.isFixed) {
    return await prisma.registrationFormField.update({
      where: { id: parsedFieldId },
      data: {
        label: fieldData.label !== undefined ? fieldData.label : existingField.label,
        placeholder: fieldData.placeholder !== undefined ? fieldData.placeholder : existingField.placeholder,
        description: fieldData.description !== undefined ? fieldData.description : existingField.description,
        isRequired: true, // Baseline fields remain required
      },
    });
  }

  // Custom field update
  return await prisma.registrationFormField.update({
    where: { id: parsedFieldId },
    data: {
      label: fieldData.label !== undefined ? fieldData.label : existingField.label,
      fieldType: fieldData.fieldType !== undefined ? fieldData.fieldType : existingField.fieldType,
      fieldScope: fieldData.fieldScope !== undefined ? fieldData.fieldScope : existingField.fieldScope,
      isRequired: fieldData.isRequired !== undefined ? Boolean(fieldData.isRequired) : existingField.isRequired,
      placeholder: fieldData.placeholder !== undefined ? fieldData.placeholder : existingField.placeholder,
      description: fieldData.description !== undefined ? fieldData.description : existingField.description,
      optionsJson: fieldData.optionsJson !== undefined ? fieldData.optionsJson : existingField.optionsJson,
      displayOrder: fieldData.displayOrder !== undefined ? fieldData.displayOrder : existingField.displayOrder,
    },
  });
};

/**
 * Delete a custom field (fixed baseline fields cannot be deleted)
 */
export const deleteFormField = async (eventId, fieldId, userId) => {
  const { form } = await getOrCreateEventForm(eventId, userId);

  const parsedFieldId = parseInt(fieldId, 10);
  if (isNaN(parsedFieldId)) {
    const error = new Error('Invalid field ID.');
    error.statusCode = 400;
    throw error;
  }

  const field = await prisma.registrationFormField.findFirst({
    where: {
      id: parsedFieldId,
      formId: form.id,
    },
  });

  if (!field) {
    const error = new Error('Form field not found.');
    error.statusCode = 404;
    throw error;
  }

  if (field.isFixed) {
    const error = new Error('Baseline participant fields (Full Name, Email, Mobile, College) cannot be deleted.');
    error.statusCode = 400;
    throw error;
  }

  await prisma.registrationFormField.delete({
    where: { id: parsedFieldId },
  });

  // Track updater on parent form
  await prisma.registrationForm.update({
    where: { id: form.id },
    data: { updatedById: userId || null },
  });

  return true;
};

/**
 * Reorder form fields in a single batch
 */
export const reorderFormFields = async (eventId, fieldOrders, userId) => {
  const { form } = await getOrCreateEventForm(eventId, userId);

  await prisma.$transaction(
    fieldOrders.map(({ id, displayOrder }) =>
      prisma.registrationFormField.updateMany({
        where: {
          id: parseInt(id, 10),
          formId: form.id,
        },
        data: {
          displayOrder: parseInt(displayOrder, 10) || 0,
        },
      })
    )
  );

  // Return updated full list of fields
  return await prisma.registrationFormField.findMany({
    where: { formId: form.id },
    orderBy: { displayOrder: 'asc' },
  });
};

/**
 * Publish form and increment version foundation
 */
export const publishEventForm = async (eventId, userId) => {
  const { form } = await getOrCreateEventForm(eventId, userId);

  const nextVersion = form.status === 'PUBLISHED' ? form.version + 1 : form.version;

  return await prisma.registrationForm.update({
    where: { id: form.id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      version: nextVersion,
      updatedById: userId || null,
    },
    include: {
      fields: { orderBy: { displayOrder: 'asc' } },
    },
  });
};
