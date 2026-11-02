import argon2 from "argon2";
import { db } from "@/lib/db";
import { createSession, limitAuth } from "@/lib/auth";
import { api, assertOrigin, json, readJson } from "@/lib/http";
import { signupSchema } from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return api(async () => {
    assertOrigin(request);
    const input = signupSchema.parse(await readJson(request));
    await limitAuth(input.email);
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    const user = await db().$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: { name: input.organizationName } });
      return tx.user.create({ data: { email: input.email, passwordHash, organizationId: organization.id } });
    });
    await createSession(user.id);
    return json({ ok: true }, 201);
  });
}
