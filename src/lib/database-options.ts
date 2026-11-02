import { readFileSync } from "node:fs";

// Shared by the application and local integration tests.
export function databaseOptions(env: NodeJS.ProcessEnv = process.env) {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL must be configured");
  const url = new URL(env.DATABASE_URL);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const ssl = env.DB_SSL === "true"
    ? { rejectUnauthorized: true, ...(env.DB_SSL_CA_FILE ? { ca: readFileSync(env.DB_SSL_CA_FILE, "utf8") } : {}) }
    : undefined;
  return {
    host: url.hostname === "[::1]" ? "::1" : url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: Number(env.DB_CONNECTION_LIMIT || 5),
    connectTimeout: 5000,
    acquireTimeout: 5000,
    // MySQL caching_sha2_password needs a server key when TLS is disabled.
    // Automatically retrieve it only on loopback in development/test.
    allowPublicKeyRetrieval: env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL === undefined
      ? local && env.NODE_ENV !== "production" && !ssl
      : env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL === "true",
    ssl,
  };
}
