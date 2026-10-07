import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  // Dashboard
  { slug: 'dashboard.view', name: 'View Dashboard', module: 'dashboard', description: 'Can view admin dashboard statistics and overview' },
  
  // Categories
  { slug: 'categories.view', name: 'View Categories', module: 'categories', description: 'Can view list and details of categories' },
  { slug: 'categories.create', name: 'Create Category', module: 'categories', description: 'Can create new categories' },
  { slug: 'categories.edit', name: 'Edit Category', module: 'categories', description: 'Can edit category details and status' },
  { slug: 'categories.delete', name: 'Delete Category', module: 'categories', description: 'Can delete or archive categories' },
  
  // Events
  { slug: 'events.view', name: 'View Events', module: 'events', description: 'Can view events list and details' },
  { slug: 'events.create', name: 'Create Event', module: 'events', description: 'Can create new events' },
  { slug: 'events.edit', name: 'Edit Event', module: 'events', description: 'Can edit event details' },
  { slug: 'events.archive', name: 'Archive Event', module: 'events', description: 'Can archive or unpublish events' },
  
  // Forms
  { slug: 'forms.view', name: 'View Forms', module: 'forms', description: 'Can view dynamic registration forms' },
  { slug: 'forms.create', name: 'Create Form', module: 'forms', description: 'Can create registration forms' },
  { slug: 'forms.edit', name: 'Edit Form', module: 'forms', description: 'Can edit registration forms' },
  { slug: 'forms.publish', name: 'Publish Form', module: 'forms', description: 'Can publish/unpublish forms' },
  
  // Registrations
  { slug: 'registrations.view', name: 'View Registrations', module: 'registrations', description: 'Can view attendee registrations' },
  { slug: 'registrations.edit', name: 'Edit Registration', module: 'registrations', description: 'Can edit attendee registration status' },
  { slug: 'registrations.export', name: 'Export Registrations', module: 'registrations', description: 'Can export registrations to Excel/CSV' },
  
  // Coordinators
  { slug: 'coordinators.view', name: 'View Coordinators', module: 'coordinators', description: 'Can view list of event coordinators' },
  { slug: 'coordinators.create', name: 'Create Coordinator', module: 'coordinators', description: 'Can invite and create new coordinators' },
  { slug: 'coordinators.edit', name: 'Edit Coordinator', module: 'coordinators', description: 'Can edit coordinator roles and permissions' },
  { slug: 'coordinators.delete', name: 'Delete Coordinator', module: 'coordinators', description: 'Can deactivate or delete coordinators' },
  
  // Audit Logs
  { slug: 'audit.view', name: 'View Audit Logs', module: 'audit', description: 'Can view system and security audit trails' },
];

const COORDINATOR_PERMISSIONS = [
  'dashboard.view',
  'categories.view',
  'events.view',
  'registrations.view',
];

async function seed() {
  console.log('[Seed] Starting database seed...');

  // 1. Seed Roles (Idempotent upsert)
  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {
      name: 'Admin',
      description: 'Full administrative access across all modules',
    },
    create: {
      name: 'Admin',
      slug: 'admin',
      description: 'Full administrative access across all modules',
    },
  });
  console.log(`[Seed] Admin role confirmed (ID: ${adminRole.id})`);

  const coordinatorRole = await prisma.role.upsert({
    where: { slug: 'coordinator' },
    update: {
      name: 'Coordinator',
      description: 'Standard event coordinator with scoped permissions',
    },
    create: {
      name: 'Coordinator',
      slug: 'coordinator',
      description: 'Standard event coordinator with scoped permissions',
    },
  });
  console.log(`[Seed] Coordinator role confirmed (ID: ${coordinatorRole.id})`);

  // 2. Seed Permissions (Idempotent upsert)
  const permissionMap = new Map();

  for (const perm of ALL_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: {
        name: perm.name,
        module: perm.module,
        description: perm.description,
      },
      create: {
        slug: perm.slug,
        name: perm.name,
        module: perm.module,
        description: perm.description,
      },
    });
    permissionMap.set(perm.slug, record);
  }
  console.log(`[Seed] Seeded ${ALL_PERMISSIONS.length} permissions successfully.`);

  // 3. Seed Admin Role Permissions (All Permissions)
  for (const permRecord of permissionMap.values()) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permRecord.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permRecord.id,
      },
    });
  }
  console.log('[Seed] Assigned ALL permissions to Admin role.');

  // 4. Seed Coordinator Role Permissions (Safe subset)
  for (const slug of COORDINATOR_PERMISSIONS) {
    const permRecord = permissionMap.get(slug);
    if (permRecord) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: coordinatorRole.id,
            permissionId: permRecord.id,
          },
        },
        update: {},
        create: {
          roleId: coordinatorRole.id,
          permissionId: permRecord.id,
        },
      });
    }
  }
  console.log(`[Seed] Assigned ${COORDINATOR_PERMISSIONS.length} safe permissions to Coordinator role.`);

  // 5. Seed Initial Admin User
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ruverse.in').trim().toLowerCase();
  const adminName = process.env.ADMIN_NAME || 'RUVERSE Admin';
  const adminPlainPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePassword2026!';

  const hashedPassword = await bcrypt.hash(adminPlainPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  });
  console.log(`[Seed] Initial admin user confirmed: ${adminUser.email} (ID: ${adminUser.id})`);

  // 6. Seed Default Festival Categories (Idempotent upsert)
  const DEFAULT_CATEGORIES = [
    { name: 'Technical & Coding', slug: 'technical-and-coding', description: 'Hackathons, algorithmic sprints, and software showcases', displayOrder: 1 },
    { name: 'Gaming & Esports', slug: 'gaming-and-esports', description: 'Competitive battle arenas, FPS, and console tournaments', displayOrder: 2 },
    { name: 'Robotics & Hardware', slug: 'robotics-and-hardware', description: 'Combat robotics, drone racing, and IoT innovation', displayOrder: 3 },
    { name: 'Workshops & Seminars', slug: 'workshops-and-seminars', description: 'Hands-on masterclasses and guest tech keynotes', displayOrder: 4 },
  ];

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayOrder: cat.displayOrder,
        isActive: true,
        createdById: adminUser.id,
        updatedById: adminUser.id,
      },
    });
  }
  console.log(`[Seed] Confirmed ${DEFAULT_CATEGORIES.length} default festival categories.`);

  console.log('[Seed] Database seed completed successfully.');
}

seed()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
