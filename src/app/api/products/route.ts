import { requireUser } from "@/lib/auth";
import { api, assertOrigin, json, readJson } from "@/lib/http";
import { productSchema } from "@/lib/validation";
import { createProduct, listProducts } from "@/services/inventory";
export async function GET(request: Request) {
  return api(async () => {
    const user = await requireUser();
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Math.min(100000, Math.floor(Number(params.get("page")) || 1)));
    return json(await listProducts(user, (params.get("search") || "").slice(0, 150), page));
  });
}
export async function POST(request: Request) {
  return api(async () => {
    assertOrigin(request);
    const user = await requireUser();
    return json(await createProduct(user, productSchema.parse(await readJson(request))), 201);
  });
}
