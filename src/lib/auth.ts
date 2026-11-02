import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { AppError } from "./errors";

const cookieName = "stockflow_session";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export const currentUser = cache(async () => {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db().session.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: { select: { id: true, email: true, organizationId: true, organization: true } } },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
});
export type Identity = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new AppError(401, "Please log in to continue.");
  return user;
}
export async function requirePageUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const ttl = Number(process.env.SESSION_TTL_SECONDS || 604800);
  if (!Number.isInteger(ttl) || ttl < 60 || ttl > 2592000) throw new Error("Invalid session lifetime");
  const expiresAt = new Date(Date.now() + ttl * 1000);
  await db().session.create({ data: { tokenHash: hash(token), userId, expiresAt } });
  const jar = await cookies();
  const previous = jar.get(cookieName)?.value;
  if (previous) await db().session.deleteMany({ where: { tokenHash: hash(previous) } });
  jar.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}
export async function revokeSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token) await db().session.deleteMany({ where: { tokenHash: hash(token) } });
  jar.set(cookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

async function hitLimit(key: string, limit: number) {
  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000);
  const digest = hash(key);
  // Atomic increments also work across multiple Node.js instances.
  await db().$executeRaw`
    INSERT INTO AuthAttempt (\`key\`, count, expiresAt) VALUES (${digest}, 1, ${expires})
    ON DUPLICATE KEY UPDATE count = IF(expiresAt <= ${now}, 1, count + 1),
      expiresAt = IF(expiresAt <= ${now}, ${expires}, expiresAt)`;
  const attempt = await db().authAttempt.findUniqueOrThrow({ where: { key: digest } });
  if (attempt.count > limit) throw new AppError(429, "Too many attempts. Please try again in 15 minutes.");
}
export async function limitAuth(email: string) {
  await hitLimit("auth:global", 200);
  await hitLimit(`auth:email:${email}`, 15);
  await db().authAttempt.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 86400000) } } });
  await db().session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
