import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";
import { createListingPublicQuery } from "../src/marketplace/application/ListingPublicQuery.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env: Record<string, string> = {};
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 1) continue;
  env[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
}
const url = (env.DATABASE_URL || "").replace(/^postgresql\+asyncpg:/i, "postgresql:");
const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  const q = createListingPublicQuery(pool);
  const l = await q.getListing("76ba13ac-6ef5-4ea0-a842-4858cb6c3a6c");
  console.log("OK listing", l);
} catch (e) {
  console.log("FAIL", (e as Error).message);
}
await pool.end();
