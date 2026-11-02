import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function assertOrigin(request: Request) {
  const expected = process.env.APP_URL;
  if (!expected) throw new Error("APP_URL must be configured");
  if (request.headers.get("origin") !== new URL(expected).origin) {
    throw new AppError(403, "This request did not come from StockFlow. Reload the page and try again.");
  }
}

export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new AppError(415, "Send JSON data.");
  }
  // Bound actual bytes, including chunked requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, "Request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 32768) { await reader.cancel(); throw new AppError(413, "Request is too large."); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new AppError(400, "Invalid JSON data."); }
}

export async function api(action: () => Promise<Response>) {
  try { return await action(); }
  catch (error) {
    if (error instanceof AppError) return json({ error: error.message }, error.status);
    if (error instanceof ZodError) {
      return json({ error: "Please check the highlighted fields.", fields: Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message])) }, 422);
    }
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") return json({ error: "That email or SKU is already in use." }, 409);
      if (error.code === "P2025") return json({ error: "Product not found." }, 404);
    }
    // Never log request bodies, sessions, credentials, or ORM query arguments.
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^P\d{4}$/.test(error.code)
      ? error.code : undefined;
    console.error("Request failed", { name: error instanceof Error ? error.name : "UnknownError", code });
    if (code && ["P1001", "P1002", "P1008", "P1017", "P2024", "P2037"].includes(code)) {
      return json({ error: "The database is temporarily unavailable. Please try again shortly." }, 503);
    }
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}
