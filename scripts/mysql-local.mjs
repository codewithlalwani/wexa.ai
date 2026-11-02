import { existsSync, mkdirSync, readFileSync, writeFileSync, openSync, closeSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const root = resolve(import.meta.dirname, "..");
const local = resolve(root, ".local");
const data = resolve(local, "mysql-dev");
const socket = resolve(local, "mysql.sock");
const credentials = resolve(local, "mysql-root.cnf");
const mode = process.argv[2] || "start";
if (!["start", "stop"].includes(mode)) throw new Error("Use start or stop.");
mkdirSync(local, { recursive: true });
const clientArgs = () => existsSync(credentials)
  ? [`--defaults-extra-file=${credentials}`]
  : ["--no-defaults", `--socket=${socket}`, "-u", "root"];
const alive = () => {
  try { execFileSync("mysqladmin", [...clientArgs(), "ping"], { stdio: "ignore" }); return true; }
  catch { return false; }
};

if (mode === "stop") {
  if (alive()) execFileSync("mysqladmin", [...clientArgs(), "shutdown"], { stdio: "inherit" });
  console.log("Project MySQL is stopped. Data remains in .local/mysql-dev.");
} else {
  if (!existsSync(resolve(data, "mysql"))) {
    mkdirSync(data, { recursive: true });
    execFileSync("mysqld", ["--no-defaults", "--initialize-insecure", `--datadir=${data}`, `--log-error=${local}/mysql-init.log`], { stdio: "inherit" });
  }
  if (!alive()) {
    const log = openSync(resolve(local, "mysql-process.log"), "a", 0o600);
    const child = spawn("mysqld", ["--no-defaults", `--datadir=${data}`, "--port=33306", "--bind-address=127.0.0.1", `--socket=${socket}`, `--pid-file=${local}/mysql.pid`, `--log-error=${local}/mysql.log`, "--mysqlx=OFF"], { detached: true, stdio: ["ignore", log, log] });
    child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
    child.unref(); closeSync(log);
    for (let i = 0; i < 60 && !alive(); i++) await new Promise((done) => setTimeout(done, 250));
    if (!alive()) throw new Error("MySQL failed to start. Check .local/mysql.log and whether port 33306 is in use.");
  }
  if (!existsSync(credentials)) {
    const password = randomBytes(24).toString("hex");
    const rootPassword = randomBytes(24).toString("hex");
    execFileSync("mysql", clientArgs(), { input: `
      CREATE DATABASE IF NOT EXISTS stockflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      CREATE USER 'stockflow'@'127.0.0.1' IDENTIFIED BY '${password}';
      GRANT ALL PRIVILEGES ON stockflow.* TO 'stockflow'@'127.0.0.1';
      ALTER USER 'root'@'localhost' IDENTIFIED BY '${rootPassword}';
    `, stdio: ["pipe", "ignore", "pipe"] });
    writeFileSync(credentials, `[client]\nuser=root\npassword=${rootPassword}\nsocket=${socket}\n`, { mode: 0o600 });
    const envPath = resolve(root, ".env");
    if (!existsSync(envPath)) {
      writeFileSync(envPath, `DATABASE_URL="mysql://stockflow:${password}@127.0.0.1:33306/stockflow"\nAPP_URL="http://localhost:3000"\nSESSION_TTL_SECONDS="604800"\nDB_SSL="false"\n`, { mode: 0o600 });
    } else {
      writeFileSync(resolve(local, "database.env"), `DATABASE_URL="mysql://stockflow:${password}@127.0.0.1:33306/stockflow"\n`, { mode: 0o600 });
      console.log("Existing .env preserved. Generated local connection saved privately in .local/database.env.");
    }
  }
  // Detect missing configuration without ever printing its contents.
  if (!existsSync(resolve(root, ".env")) || !readFileSync(resolve(root, ".env"), "utf8").includes("DATABASE_URL=")) {
    console.log("Configure DATABASE_URL in .env before starting the app.");
  }
  console.log("Project MySQL is ready at 127.0.0.1:33306. Credentials stay in ignored local files.");
}
