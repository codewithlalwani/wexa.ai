"use client";
export class RequestError extends Error {
  constructor(message: string, public fields: Record<string, string> = {}) { super(message); }
}
export async function mutate(path: string, method: string, body?: unknown) {
  const response = await fetch(path, {
    method, headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (response.status === 401 && !path.startsWith("/api/auth/")) {
    // Clear the router's private page state as well as navigating after expiry.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }
  if (!response.ok) throw new RequestError(data.error || "Please try again.", data.fields);
  return data;
}
