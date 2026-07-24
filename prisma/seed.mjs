// Vallordocs database seed (PRD 2. fejezet – Szerepkörök, Platform operátor).
//
// Idempotent bootstrap that provisions:
//   1. the system RBAC roles,
//   2. a primary tenant (the operating company),
//   3. the primary super-admin account — a single "fő felhasználó" that is both a
//      normal company admin (tenant_admin) AND a platform super-admin
//      (platform_owner), the role behind the separate "Szuperadmin" menu entry.
//
// Run with:  npm run db:seed   (or `npx prisma db seed`)
//
// The super-admin password is taken from SUPERADMIN_PASSWORD. When unset, a
// strong random password is generated and printed once so the account is never
// created with a weak, guessable secret.

import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import { randomBytes, randomInt } from 'node:crypto';

const prisma = new PrismaClient();

// Keep these in step with prisma/schema.prisma (RoleName) and the RBAC catalogue
// in src/modules/auth/rbac.ts. Descriptions are informational only.
const SYSTEM_ROLES = [
  ['platform_owner', 'Platform owner — full super-admin access'],
  ['platform_admin', 'Platform administrator'],
  ['tenant_admin', 'Company (tenant) administrator'],
  ['dispatcher', 'Dispatcher'],
  ['office_user', 'Office user'],
  ['driver', 'Driver'],
  ['read_only', 'Read-only user'],
];

// Argon2id parameters — must match src/modules/auth/password.ts so hashes verify.
const ARGON2_OPTIONS = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

const SUPERADMIN_EMAIL = (
  process.env.SUPERADMIN_EMAIL ?? 'vallorteam23@gmail.com'
)
  .trim()
  .toLowerCase();
const SUPERADMIN_NAME = process.env.SUPERADMIN_NAME ?? 'Vallor Superadmin';
const TENANT_NAME = process.env.SEED_TENANT_NAME ?? 'Vallor';

// The primary account is both a normal admin and a super-admin.
const SUPERADMIN_ROLES = ['tenant_admin', 'platform_owner'];

/** Builds a policy-compliant random password (>=12 chars, mixed classes). */
function generatePassword() {
  const pick = (set) => set[randomInt(set.length)];
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digit = '23456789';
  const special = '!@#$%^&*-_';
  const base = randomBytes(16).toString('base64url');
  // Guarantee at least one character from each required class.
  return `${pick(upper)}${pick(lower)}${pick(digit)}${pick(special)}${base}`;
}

async function seedRoles() {
  for (const [name, description] of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { name },
      update: { description, isSystem: true },
      create: { name, description, isSystem: true },
    });
  }
  console.log(`✓ ${SYSTEM_ROLES.length} system roles ensured`);
}

async function seedTenant() {
  const existing = await prisma.tenant.findFirst({
    where: { companyName: TENANT_NAME, deletedAt: null },
  });
  if (existing) return existing;
  const tenant = await prisma.tenant.create({
    data: { companyName: TENANT_NAME, isActive: true },
  });
  console.log(`✓ tenant created: ${TENANT_NAME} (${tenant.id})`);
  return tenant;
}

async function seedSuperadmin(tenantId) {
  const providedPassword = process.env.SUPERADMIN_PASSWORD;
  const password = providedPassword ?? generatePassword();
  const passwordHash = await hash(password, ARGON2_OPTIONS);

  const roles = await prisma.role.findMany({
    where: { name: { in: SUPERADMIN_ROLES } },
    select: { id: true, name: true },
  });

  const existing = await prisma.user.findFirst({
    where: { email: SUPERADMIN_EMAIL },
    include: { userRoles: true },
  });

  let user;
  if (existing) {
    // Reset roles to exactly the desired set, then update identity/credentials.
    await prisma.userRole.deleteMany({ where: { userId: existing.id } });
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: SUPERADMIN_NAME,
        tenantId,
        status: 'active',
        // Only overwrite the password when one was explicitly supplied, so
        // re-seeding does not silently rotate an operator's chosen secret.
        ...(providedPassword ? { passwordHash } : {}),
        userRoles: { create: roles.map((r) => ({ roleId: r.id })) },
      },
      include: { userRoles: { include: { role: true } } },
    });
    console.log(`✓ super-admin updated: ${SUPERADMIN_EMAIL}`);
  } else {
    user = await prisma.user.create({
      data: {
        tenantId,
        name: SUPERADMIN_NAME,
        email: SUPERADMIN_EMAIL,
        status: 'active',
        passwordHash,
        userRoles: { create: roles.map((r) => ({ roleId: r.id })) },
      },
      include: { userRoles: { include: { role: true } } },
    });
    console.log(`✓ super-admin created: ${SUPERADMIN_EMAIL}`);
  }

  const roleNames = user.userRoles.map((ur) => ur.role.name).join(', ');
  console.log(`  roles: ${roleNames}`);

  if (!existing || providedPassword) {
    if (providedPassword) {
      console.log('  password: (from SUPERADMIN_PASSWORD)');
    } else {
      console.log(`  generated password: ${password}`);
      console.log('  ⚠ store this now — it will not be shown again.');
    }
  } else {
    console.log('  password: unchanged (set SUPERADMIN_PASSWORD to rotate)');
  }
}

async function main() {
  await seedRoles();
  const tenant = await seedTenant();
  await seedSuperadmin(tenant.id);
  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
