import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseOptions } from "./database-options";

const globalDb = globalThis as unknown as { stockflowDb?: PrismaClient };

export function db() {
  if (!globalDb.stockflowDb) {
    const adapter = new PrismaMariaDb(databaseOptions());
    globalDb.stockflowDb = new PrismaClient({ adapter });
  }
  return globalDb.stockflowDb;
}
