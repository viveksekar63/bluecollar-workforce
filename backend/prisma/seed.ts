import "dotenv/config";

import { PrismaClient, RoleName, UserStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import { PERMISSIONS } from "../src/auth/permissions/permissions";
import { ROLE_PERMISSIONS } from "../src/auth/permissions/role-permissions";
import { seedSubscriptionPlans } from "./seed-subscription-plans";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "omvivek50@gmail.com";
const ADMIN_PHONE = "+919994864619";
const ADMIN_PASSWORD = "Admin@123";

async function main() {
  console.log("🌱 Starting database seed...\n");

  console.log("Creating roles...");
  const roleNames: RoleName[] = [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.VERIFICATION_AGENT, RoleName.EMPLOYER, RoleName.SUPERVISOR, RoleName.WORKER];
  const roles = new Map<RoleName, { id: string; name: string }>();
  for (const roleName of roleNames) {
    const role = await prisma.role.upsert({ where: { name: roleName }, update: {}, create: { name: roleName } });
    roles.set(roleName, role);
    console.log(`  ✓ ${roleName}`);
  }

  console.log("\nCreating permissions...");
  for (const permissionName of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { name: permissionName },
      update: { description: permissionName },
      create: { name: permissionName, description: permissionName },
    });
    console.log(`  ✓ ${permissionName}`);
  }

  console.log("\nAssigning permissions to roles...");
  for (const [roleName, rolePermissions] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roles.get(roleName as RoleName);
    if (!role) continue;
    for (const permissionName of rolePermissions) {
      const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
    console.log(`  ✓ ${roleName}: ${rolePermissions.length} permissions`);
  }

  console.log("\nCreating/updating admin user...");
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { phone: ADMIN_PHONE, passwordHash, firstName: "Vivekanandan", lastName: "Sekar", status: UserStatus.ACTIVE },
    create: { email: ADMIN_EMAIL, phone: ADMIN_PHONE, passwordHash, firstName: "Vivekanandan", lastName: "Sekar", status: UserStatus.ACTIVE },
  });

  const superAdminRole = roles.get(RoleName.SUPER_ADMIN);
  if (!superAdminRole) throw new Error("SUPER_ADMIN role was not created");
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: superAdminRole.id },
  });

  console.log("\n======================================");
  console.log("SUPER ADMIN CREATED / UPDATED");
  console.log("======================================");
  console.log(`ID:     ${adminUser.id}`);
  console.log(`Email:  ${adminUser.email}`);
  console.log(`Phone:  ${adminUser.phone}`);
  console.log(`Role:   ${RoleName.SUPER_ADMIN}`);
  console.log(`Status: ${adminUser.status}`);
  console.log("======================================");

  await seedSubscriptionPlans(prisma);

  console.log("\n======================================");
  console.log("RBAC SUMMARY");
  console.log("======================================");
  for (const roleName of roleNames) console.log(`${roleName}: ${(ROLE_PERMISSIONS[roleName] ?? []).length} permissions`);
  console.log("======================================");
  console.log("\n🌱 Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("\n❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
