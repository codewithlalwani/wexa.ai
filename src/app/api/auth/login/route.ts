import argon2 from "argon2";
import { db } from "@/lib/db";
import { createSession, limitAuth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { api, assertOrigin, json, readJson } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
export const runtime = "nodejs";
// Hash once per process to keep nonexistent accounts on the password-verification path.
let dummyHash: Promise<string> | undefined;
export async function POST(request: Request) {
  return api(async () => {
    assertOrigin(request);
    const input = loginSchema.parse(await readJson(request));
    await limitAuth(input.email);
    const user = await db().user.findUnique({ where: { email: input.email } });
    dummyHash ??= argon2.hash("not-an-account-password", { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    const valid = await argon2.verify(user?.passwordHash ?? await dummyHash, input.password);
    if (!user || !valid) throw new AppError(401, "Email or password is incorrect.");
    await createSession(user.id);
    return json({ ok: true });
  });
}
