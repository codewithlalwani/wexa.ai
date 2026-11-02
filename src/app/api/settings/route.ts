import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { api, assertOrigin, json, readJson } from "@/lib/http";
import { settingsSchema } from "@/lib/validation";
export async function GET() { return api(async () => json((await requireUser()).organization)); }
export async function PATCH(request: Request) {
  return api(async () => {
    assertOrigin(request);
    const user = await requireUser();
    const input = settingsSchema.parse(await readJson(request));
    return json(await db().organization.update({ where: { id: user.organizationId }, data: input }));
  });
}
