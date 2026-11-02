import { revokeSession } from "@/lib/auth";
import { api, assertOrigin, json } from "@/lib/http";
export async function POST(request: Request) {
  return api(async () => { assertOrigin(request); await revokeSession(); return json({ ok: true }); });
}
