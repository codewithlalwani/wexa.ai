import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { databaseOptions } from "../src/lib/database-options";

export const baseURL = process.env.TEST_BASE_URL || "http://localhost:3000";
export function localTestDb() {
  const url = new URL(process.env.DATABASE_URL!);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)) {
    throw new Error("These tests create and remove test accounts. Only local app/database targets are allowed.");
  }
  return new PrismaClient({ adapter: new PrismaMariaDb({ ...databaseOptions(), connectionLimit: 2 }) });
}
export async function cleanAccounts(db: ReturnType<typeof localTestDb>, emails: string[]) {
  const users = await db.user.findMany({ where: { email: { in: emails } } });
  const ids = users.map((u) => u.organizationId);
  // Remove only records belonging to this run's unique test accounts.
  await db.product.deleteMany({ where: { organizationId: { in: ids } } });
  await db.organization.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
}
