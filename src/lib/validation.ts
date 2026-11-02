import { z } from "zod";

export const emailSchema = z.email().trim().toLowerCase().max(254);
const password = z.string().min(12, "Use at least 12 characters.").max(128);
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
export const signupSchema = z.object({
  email: emailSchema,
  password,
  confirmPassword: z.string(),
  organizationName: z.string().trim().min(1, "Enter your organization name.").max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.", path: ["confirmPassword"],
});

export const quantitySchema = z.number().int().min(0).max(2147483647);
const money = z.string().trim().regex(/^\d{1,10}(\.\d{1,2})?$/, "Use a positive amount with up to two decimal places.").nullable();
const productFields = z.object({
  name: z.string().trim().min(1, "Enter a product name.").max(150),
  sku: z.string().trim().min(1, "Enter a SKU.").max(64).transform((v) => v.toUpperCase()),
  description: z.string().trim().max(5000).nullable(),
  quantityOnHand: quantitySchema,
  costPrice: money,
  sellingPrice: money,
  lowStockThreshold: quantitySchema.nullable(),
}).strict();
export const productSchema = productFields.extend({
  description: productFields.shape.description.default(null),
  costPrice: money.default(null),
  sellingPrice: money.default(null),
  lowStockThreshold: quantitySchema.nullable().default(null),
});
export const productPatchSchema = productFields.partial().refine((v) => Object.keys(v).length > 0, "Provide at least one field.");
export const settingsSchema = z.object({ defaultLowStockThreshold: quantitySchema }).strict();
export type ProductInput = z.infer<typeof productSchema>;

export function effectiveThreshold(threshold: number | null, defaultThreshold: number) {
  return threshold ?? defaultThreshold;
}
export function isLowStock(quantity: number, threshold: number | null, defaultThreshold: number) {
  return quantity <= effectiveThreshold(threshold, defaultThreshold);
}
