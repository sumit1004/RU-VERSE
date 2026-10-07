import { prisma } from '../config/database.js';

/**
 * Generate a URL-friendly slug from string
 */
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[\s\W-]+/g, '-') // Replace spaces, non-word chars and hyphens with a single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Fetch all active categories for public API
 */
export const getPublicCategories = async () => {
  return await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      displayOrder: true,
    },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' },
    ],
  });
};

/**
 * Fetch all categories for admin management
 */
export const getAdminCategories = async () => {
  return await prisma.category.findMany({
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      updater: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: { events: true },
      },
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });
};

/**
 * Get single category by ID
 */
export const getCategoryById = async (id) => {
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) return null;

  return await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      updater: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { events: true },
      },
    },
  });
};

/**
 * Create a new category with slugification and duplicate protection
 */
export const createCategory = async ({ name, description, displayOrder = 0, isActive = true, userId }) => {
  const cleanName = name.trim();
  const slug = slugify(cleanName);

  // Case-insensitive duplicate check by name or slug
  const existingCategories = await prisma.category.findMany({
    where: {
      OR: [
        { slug: slug },
        { name: cleanName },
      ],
    },
  });

  const isDuplicate = existingCategories.some(
    (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (isDuplicate) {
    const error = new Error('Category already exists.');
    error.statusCode = 409;
    throw error;
  }

  return await prisma.category.create({
    data: {
      name: cleanName,
      slug,
      description: description ? description.trim() : null,
      displayOrder: parseInt(displayOrder, 10) || 0,
      isActive: Boolean(isActive),
      createdById: userId || null,
      updatedById: userId || null,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      updater: { select: { id: true, name: true, email: true } },
    },
  });
};

/**
 * Update an existing category
 */
export const updateCategory = async (id, { name, description, displayOrder, isActive, userId }) => {
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) {
    const error = new Error('Invalid category ID.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existing) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  const cleanName = name !== undefined ? name.trim() : existing.name;
  const newSlug = slugify(cleanName);

  // Check for duplicate name/slug on other category records
  if (cleanName.toLowerCase() !== existing.name.toLowerCase()) {
    const duplicates = await prisma.category.findMany({
      where: {
        id: { not: categoryId },
        OR: [
          { slug: newSlug },
          { name: cleanName },
        ],
      },
    });

    const hasDuplicate = duplicates.some(
      (c) => c.slug.toLowerCase() === newSlug.toLowerCase() || c.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (hasDuplicate) {
      const error = new Error('Category already exists.');
      error.statusCode = 409;
      throw error;
    }
  }

  return await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: cleanName,
      slug: newSlug,
      description: description !== undefined ? (description ? description.trim() : null) : existing.description,
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) || 0 : existing.displayOrder,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      updatedById: userId || null,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      updater: { select: { id: true, name: true, email: true } },
    },
  });
};

/**
 * Toggle or update category active status
 */
export const updateCategoryStatus = async (id, isActive, userId) => {
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) {
    const error = new Error('Invalid category ID.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existing) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.category.update({
    where: { id: categoryId },
    data: {
      isActive: Boolean(isActive),
      updatedById: userId || null,
    },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      updater: { select: { id: true, name: true, email: true } },
    },
  });
};

/**
 * Safely delete or deactivate a category
 */
export const deleteCategory = async (id) => {
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) {
    const error = new Error('Invalid category ID.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { events: true },
      },
    },
  });

  if (!existing) {
    const error = new Error('Category not found.');
    error.statusCode = 404;
    throw error;
  }

  if (existing._count?.events > 0) {
    const assignedEvents = await prisma.event.findMany({
      where: { categoryId },
      select: { id: true, title: true, isPublished: true, isActive: true, archivedAt: true },
      take: 5,
    });
    const eventTitles = assignedEvents
      .map((e) => `"${e.title}"${e.archivedAt ? ' (Archived)' : (!e.isPublished ? ' (Draft)' : (!e.isActive ? ' (Inactive)' : ''))}`)
      .join(', ');
    const moreText = existing._count.events > 5 ? ` and ${existing._count.events - 5} more` : '';
    const error = new Error(
      `Category cannot be deleted because ${existing._count.events} event(s) are assigned to it: ${eventTitles}${moreText}. Please delete or reassign those events first, or deactivate this category instead.`
    );
    error.statusCode = 400;
    throw error;
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });

  return true;
};
