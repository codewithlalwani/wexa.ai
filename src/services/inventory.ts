import "server-only";
import { db } from "@/lib/db";
import type { Identity } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { effectiveThreshold, isLowStock, type ProductInput } from "@/lib/validation";
import type { Product } from "@/generated/prisma/client";

export function serializeProduct(product: Product, defaultThreshold: number) {
  return {
    id: product.id, name: product.name, sku: product.sku,
    description: product.description, quantityOnHand: product.quantityOnHand,
    costPrice: product.costPrice?.toFixed(2) ?? null,
    sellingPrice: product.sellingPrice?.toFixed(2) ?? null,
    lowStockThreshold: product.lowStockThreshold,
    effectiveThreshold: effectiveThreshold(product.lowStockThreshold, defaultThreshold),
    isLowStock: isLowStock(product.quantityOnHand, product.lowStockThreshold, defaultThreshold),
    updatedAt: product.updatedAt.toISOString(),
  };
}
export type ProductView = ReturnType<typeof serializeProduct>;

export async function listProducts(user: Identity, search = "", page = 1) {
  const where = {
    organizationId: user.organizationId,
    ...(search ? { OR: [{ name: { contains: search } }, { sku: { contains: search } }] } : {}),
  };
  const [products, total] = await db().$transaction([
    db().product.findMany({ where, orderBy: { updatedAt: "desc" }, take: 25, skip: (page - 1) * 25 }),
    db().product.count({ where }),
  ]);
  return { products: products.map((p) => serializeProduct(p, user.organization.defaultLowStockThreshold)), total, page, pageSize: 25 };
}
export async function getProduct(user: Identity, id: string) {
  const product = await db().product.findFirst({ where: { id, organizationId: user.organizationId } });
  if (!product) throw new AppError(404, "Product not found.");
  return serializeProduct(product, user.organization.defaultLowStockThreshold);
}
export async function createProduct(user: Identity, input: ProductInput) {
  const product = await db().product.create({ data: { ...input, organizationId: user.organizationId, lastUpdatedBy: user.id } });
  return serializeProduct(product, user.organization.defaultLowStockThreshold);
}
export async function updateProduct(user: Identity, id: string, input: Partial<ProductInput>) {
  const product = await db().product.update({ where: { id, organizationId: user.organizationId }, data: { ...input, lastUpdatedBy: user.id } });
  return serializeProduct(product, user.organization.defaultLowStockThreshold);
}
export async function deleteProduct(user: Identity, id: string) {
  const result = await db().product.deleteMany({ where: { id, organizationId: user.organizationId } });
  if (!result.count) throw new AppError(404, "Product not found.");
}
export async function dashboard(user: Identity) {
  const threshold = user.organization.defaultLowStockThreshold;
  // Field references compare each product's quantity against its own threshold.
  const lowWhere = { organizationId: user.organizationId, OR: [
    { lowStockThreshold: null, quantityOnHand: { lte: threshold } },
    { lowStockThreshold: { not: null }, quantityOnHand: { lte: db().product.fields.lowStockThreshold } },
  ] };
  const [aggregate, lowStockCount, lowStock] = await db().$transaction([
    db().product.aggregate({ where: { organizationId: user.organizationId }, _count: true, _sum: { quantityOnHand: true } }),
    db().product.count({ where: lowWhere }),
    db().product.findMany({ where: lowWhere, orderBy: [{ quantityOnHand: "asc" }, { name: "asc" }], take: 100 }),
  ]);
  return { totalProducts: aggregate._count, totalQuantity: aggregate._sum.quantityOnHand ?? 0, lowStockCount,
    lowStock: lowStock.map((p) => serializeProduct(p, threshold)) };
}
