import { execSync } from "node:child_process";
import path from "node:path";

export default async function globalSetup() {
  // Point Prisma to a separate test database
  const projectRoot = process.cwd();
  process.env.DATABASE_URL = `file:${path.join(projectRoot, "prisma", "test.db")}`;

  // Minimal QBO env (values are placeholders for tests)
  process.env.QBO_CLIENT_ID = process.env.QBO_CLIENT_ID || "test-client-id";
  process.env.QBO_CLIENT_SECRET = process.env.QBO_CLIENT_SECRET || "test-client-secret";
  process.env.QBO_REDIRECT_URI = process.env.QBO_REDIRECT_URI || "http://localhost:3000/api/qbo/callback";
  process.env.QBO_ENV = process.env.QBO_ENV || "sandbox";
  process.env.QBO_ALLOWED_REALMID = process.env.QBO_ALLOWED_REALMID || "9999999999";

  // Ensure schema is pushed to the test DB (no prisma generate needed for runtime)
  try {
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
  } catch (e) {
    console.error("Failed to push Prisma schema to test DB:", e);
    throw e;
  }
}

