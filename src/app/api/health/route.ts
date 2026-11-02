import { db } from "@/lib/db";
import { json } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try { await db().$queryRaw`SELECT 1`; return json({ status: "healthy" }); }
  catch { return json({ status: "unhealthy" }, 503); }
}
