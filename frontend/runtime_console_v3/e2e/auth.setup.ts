import { test as setup } from "@playwright/test";
import { spawnSync } from "child_process";
import path from "path";
import { setupTestUsers } from "./helpers/supabase-auth";

const baseURL = process.env.BASE_URL || "http://localhost:3000";

function assertNotBeta() {
  const repoRoot = path.resolve(__dirname, "../../..");
  const guard = path.join(repoRoot, "testing", "guards", "assert-not-beta.mjs");
  const r = spawnSync(process.execPath, [guard, "playwright"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "auth.setup blocked in beta/production");
  }
}

setup("authenticate test users", async () => {
  assertNotBeta();
  await setupTestUsers(baseURL);
});
