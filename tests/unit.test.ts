import { test } from "node:test";
import assert from "node:assert/strict";
import { productSchema, productPatchSchema, signupSchema, settingsSchema, isLowStock, effectiveThreshold } from "../src/lib/validation";
import { databaseOptions } from "../src/lib/database-options";

test("local MySQL authentication retrieves its public key without enabling remote or production defaults", () => {
  const env: NodeJS.ProcessEnv = { DATABASE_URL: "mysql://user:password@127.0.0.1:3306/stockflow", NODE_ENV: "development" };
  assert.equal(databaseOptions(env).allowPublicKeyRetrieval, true);
  assert.equal(databaseOptions({ ...env, NODE_ENV: "production" }).allowPublicKeyRetrieval, false);
  assert.equal(databaseOptions({ ...env, DATABASE_URL: "mysql://user:password@db.example.com/stockflow" }).allowPublicKeyRetrieval, false);
  assert.equal(databaseOptions({ ...env, DB_SSL: "true" }).allowPublicKeyRetrieval, false);
  assert.equal(databaseOptions({ ...env, DB_ALLOW_PUBLIC_KEY_RETRIEVAL: "false" }).allowPublicKeyRetrieval, false);
  assert.equal(databaseOptions({ ...env, DB_ALLOW_PUBLIC_KEY_RETRIEVAL: "true" }).allowPublicKeyRetrieval, true);
});

const product = { name: "Canvas tote", sku: " tote-001 ", quantityOnHand: 5 };
test("SKU normalization and optional defaults", () => {
  const value = productSchema.parse(product);
  assert.equal(value.sku, "TOTE-001");
  assert.equal(value.costPrice, null);
  assert.equal(value.lowStockThreshold, null);
});
test("zero threshold overrides the organization default", () => {
  assert.equal(effectiveThreshold(0, 5), 0);
  assert.equal(isLowStock(1, 0, 5), false);
  assert.equal(isLowStock(0, 0, 5), true);
});
test("threshold equality and null fallback", () => {
  assert.equal(isLowStock(5, null, 5), true);
  assert.equal(isLowStock(6, null, 5), false);
  assert.equal(isLowStock(8, 8, 5), true);
});
test("reject invalid quantities and integer overflow", () => {
  for (const value of [-1, 1.5, NaN, Infinity, 2147483648, "5", null]) {
    assert.equal(productSchema.safeParse({ ...product, quantityOnHand: value }).success, false);
  }
});
test("accept decimal money strings without losing precision", () => {
  assert.equal(productSchema.parse({ ...product, costPrice: "9999999999.99" }).costPrice, "9999999999.99");
  assert.equal(productSchema.parse({ ...product, sellingPrice: "0.00" }).sellingPrice, "0.00");
});
test("reject invalid money, floats, excess precision, and overflow", () => {
  for (const value of ["-1", "1.001", "1e3", "10000000000", "", 1.25]) {
    assert.equal(productSchema.safeParse({ ...product, sellingPrice: value }).success, false);
  }
});
test("reject tenant injection and unknown update fields", () => {
  assert.equal(productSchema.safeParse({ ...product, organizationId: "other" }).success, false);
  assert.equal(productPatchSchema.safeParse({ organizationId: "other" }).success, false);
  assert.equal(productPatchSchema.safeParse({}).success, false);
});
test("partial stock update does not reset nullable product details", () => {
  assert.deepEqual(productPatchSchema.parse({ quantityOnHand: 9 }), { quantityOnHand: 9 });
});
test("signup requires matching strong passwords", () => {
  const input = { email: "owner@example.com", organizationName: "Store", password: "a-long-test-password", confirmPassword: "different" };
  assert.equal(signupSchema.safeParse(input).success, false);
  assert.equal(signupSchema.safeParse({ ...input, password: "short", confirmPassword: "short" }).success, false);
  assert.equal(signupSchema.parse({ ...input, confirmPassword: input.password }).email, input.email);
});
test("settings allow zero but reject negatives and fractions", () => {
  assert.equal(settingsSchema.parse({ defaultLowStockThreshold: 0 }).defaultLowStockThreshold, 0);
  assert.equal(settingsSchema.safeParse({ defaultLowStockThreshold: -1 }).success, false);
  assert.equal(settingsSchema.safeParse({ defaultLowStockThreshold: 1.5 }).success, false);
});
