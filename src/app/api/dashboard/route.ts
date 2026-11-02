import { requireUser } from "@/lib/auth";
import { api, json } from "@/lib/http";
import { dashboard } from "@/services/inventory";
export async function GET() { return api(async () => json(await dashboard(await requireUser()))); }
