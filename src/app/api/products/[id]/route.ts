import { requireUser } from "@/lib/auth";
import { api, assertOrigin, json, readJson } from "@/lib/http";
import { productPatchSchema } from "@/lib/validation";
import { deleteProduct, getProduct, updateProduct } from "@/services/inventory";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return api(async () => json(await getProduct(await requireUser(), (await context.params).id)));
}
export async function PATCH(request: Request, context: Context) {
  return api(async () => {
    assertOrigin(request);
    const user = await requireUser();
    return json(await updateProduct(user, (await context.params).id, productPatchSchema.parse(await readJson(request))));
  });
}
export async function DELETE(request: Request, context: Context) {
  return api(async () => {
    assertOrigin(request);
    await deleteProduct(await requireUser(), (await context.params).id);
    return json({ ok: true });
  });
}
