import { Pool } from "pg";
import { createProviderScheduler } from "../scheduler/ProviderScheduler.js";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const pool = new Pool({ connectionString: databaseUrl });
  const scheduler = createProviderScheduler(pool);
  if (process.argv.includes("--bootstrap")) {
    await scheduler.syncFromMemoryRegistry();
    console.log("schedules bootstrapped");
  }
  const result = await scheduler.tick();
  console.log(JSON.stringify(result));
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
