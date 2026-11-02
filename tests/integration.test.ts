import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { baseURL, localTestDb, cleanAccounts } from "./helpers";

test("MySQL-backed authentication and inventory acceptance", async (t) => {
  const db = localTestDb();
  const key = randomUUID();
  const emails = [`a-${key}@stockflow.test`, `b-${key}@stockflow.test`];
  const password = "Test-inventory-password-2026";
  let a = "", b = "", id = "", zeroId = "";
  async function request(path: string, method = "GET", body?: unknown, cookie = "", origin = baseURL) {
    const response = await fetch(baseURL + path, { method, headers: { Origin: origin, "Content-Type": "application/json", Cookie: cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json();
    return { response, data, cookie: response.headers.get("set-cookie")?.split(";")[0] || "" };
  }
  try {
    await t.test("health and unauthorized access", async () => {
      assert.equal((await request("/api/health")).response.status, 200);
      for (const path of ["/api/products", "/api/dashboard", "/api/settings"]) assert.equal((await request(path)).response.status, 401);
    });
    await t.test("signup creates isolated owners with secure cookie attributes", async () => {
      for (let i = 0; i < 2; i++) {
        const result = await request("/api/auth/signup", "POST", { email: emails[i], password, confirmPassword: password, organizationName: `Integration ${i} ${key}` });
        assert.equal(result.response.status, 201, JSON.stringify(result.data));
        assert.match(result.response.headers.get("set-cookie")!, /HttpOnly/i);
        assert.match(result.response.headers.get("set-cookie")!, /SameSite=lax/i);
        if (i === 0) a = result.cookie; else b = result.cookie;
      }
      const users = await db.user.findMany({ where: { email: { in: emails } } });
      assert.equal(users.length, 2);
      assert.notEqual(users[0].organizationId, users[1].organizationId);
      assert.match(users[0].passwordHash, /^\$argon2id\$/);
    });
    await t.test("duplicate signup is atomic and leaves no orphan organization", async () => {
      const before = await db.organization.count();
      const result = await request("/api/auth/signup", "POST", { email: emails[0], password, confirmPassword: password, organizationName: "Must roll back" });
      assert.equal(result.response.status, 409);
      assert.equal(await db.organization.count(), before);
    });
    await t.test("product create, SKU normalization, decimal precision and duplicate handling", async () => {
      const input = { name: "Canvas tote", sku: " tote-001 ", description: "Reusable", quantityOnHand: 5, costPrice: "0.10", sellingPrice: "9999999999.99", lowStockThreshold: null };
      const result = await request("/api/products", "POST", input, a);
      assert.equal(result.response.status, 201, JSON.stringify(result.data));
      id = result.data.id;
      assert.equal(result.data.sku, "TOTE-001");
      assert.equal(result.data.sellingPrice, "9999999999.99");
      assert.equal(result.data.isLowStock, true);
      assert.equal((await request("/api/products", "POST", input, a)).response.status, 409);
      assert.equal((await request("/api/products", "POST", input, b)).response.status, 201);
    });
    await t.test("tenant cannot read, update, delete, or inject another tenant", async () => {
      assert.equal((await request(`/api/products/${id}`, "GET", undefined, b)).response.status, 404);
      assert.equal((await request(`/api/products/${id}`, "PATCH", { quantityOnHand: 999 }, b)).response.status, 404);
      assert.equal((await request(`/api/products/${id}`, "DELETE", undefined, b)).response.status, 404);
      assert.equal((await request(`/api/products/${id}`, "PATCH", { organizationId: "other" }, a)).response.status, 422);
      const list = await request("/api/products", "GET", undefined, b);
      assert.equal(list.data.total, 1);
      assert.notEqual(list.data.products[0].id, id);
      assert.equal((await request("/api/dashboard", "GET", undefined, b)).data.totalProducts, 1);
    });
    await t.test("zero threshold, dashboard aggregation, and partial edits", async () => {
      const zero = await request("/api/products", "POST", { name: "Zero threshold", sku: "ZERO", quantityOnHand: 1, lowStockThreshold: 0 }, a);
      assert.equal(zero.response.status, 201); zeroId = zero.data.id;
      assert.equal(zero.data.isLowStock, false);
      const overview = await request("/api/dashboard", "GET", undefined, a);
      assert.equal(overview.data.totalProducts, 2);
      assert.equal(overview.data.totalQuantity, 6);
      assert.equal(overview.data.lowStockCount, 1);
      assert.equal(overview.data.lowStock[0].id, id);
      const updated = await request(`/api/products/${id}`, "PATCH", { quantityOnHand: 6 }, a);
      assert.equal(updated.data.costPrice, "0.10");
      assert.equal(updated.data.description, "Reusable");
      assert.equal(updated.data.isLowStock, false);
      assert.equal((await request("/api/dashboard", "GET", undefined, a)).data.lowStockCount, 0);
    });
    await t.test("settings refresh inherited thresholds without changing explicit zero", async () => {
      assert.equal((await request("/api/settings", "PATCH", { defaultLowStockThreshold: 6 }, a)).response.status, 200);
      const overview = await request("/api/dashboard", "GET", undefined, a);
      assert.equal(overview.data.lowStockCount, 1);
      assert.equal(overview.data.lowStock[0].effectiveThreshold, 6);
      assert.equal((await request(`/api/products/${zeroId}`, "GET", undefined, a)).data.effectiveThreshold, 0);
      assert.equal((await request("/api/settings", "GET", undefined, b)).data.defaultLowStockThreshold, 5);
    });
    await t.test("search, server validation and cross-origin mutation protection", async () => {
      assert.equal((await request("/api/products?search=tote", "GET", undefined, a)).data.total, 1);
      for (const value of [-1, 1.5, 2147483648]) assert.equal((await request(`/api/products/${id}`, "PATCH", { quantityOnHand: value }, a)).response.status, 422);
      assert.equal((await request(`/api/products/${id}`, "PATCH", { sellingPrice: "1.234" }, a)).response.status, 422);
      assert.equal((await request(`/api/products/${id}`, "PATCH", { quantityOnHand: 8 }, a, "https://untrusted.test")).response.status, 403);
      assert.equal((await request(`/api/products/${id}`, "DELETE", undefined, a, "")).response.status, 403);
    });
    await t.test("logout revokes token, login works and expiration is enforced", async () => {
      assert.equal((await request("/api/auth/logout", "POST", undefined, a)).response.status, 200);
      assert.equal((await request("/api/products", "GET", undefined, a)).response.status, 401);
      assert.equal((await request("/api/auth/login", "POST", { email: emails[0], password: "wrong-password" })).response.status, 401);
      const result = await request("/api/auth/login", "POST", { email: emails[0], password });
      assert.equal(result.response.status, 200); a = result.cookie;
      assert.equal((await request("/api/products", "GET", undefined, a)).data.total, 2);
      const user = await db.user.findUniqueOrThrow({ where: { email: emails[0] } });
      await db.session.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
      assert.equal((await request("/api/products", "GET", undefined, a)).response.status, 401);
      a = (await request("/api/auth/login", "POST", { email: emails[0], password })).cookie;
    });
    await t.test("delete refreshes totals and leaves an empty organization", async () => {
      assert.equal((await request(`/api/products/${id}`, "DELETE", undefined, a)).response.status, 200);
      assert.equal((await request(`/api/products/${zeroId}`, "DELETE", undefined, a)).response.status, 200);
      assert.equal((await request(`/api/products/${id}`, "GET", undefined, a)).response.status, 404);
      const result = await request("/api/dashboard", "GET", undefined, a);
      assert.equal(result.data.totalProducts, 0);
      assert.equal(result.data.totalQuantity, 0);
      assert.deepEqual(result.data.lowStock, []);
    });
    await t.test("database-backed login rate limiting", async () => {
      const email = `limit-${key}@stockflow.test`;
      for (let i = 0; i < 15; i++) assert.equal((await request("/api/auth/login", "POST", { email, password })).response.status, 401);
      assert.equal((await request("/api/auth/login", "POST", { email, password })).response.status, 429);
    });
  } finally { await cleanAccounts(db, emails); }
});
