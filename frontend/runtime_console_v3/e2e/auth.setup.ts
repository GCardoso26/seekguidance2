import { test as setup } from "@playwright/test";
import { setupTestUsers } from "./helpers/supabase-auth";

const baseURL = process.env.BASE_URL || "http://localhost:3000";

setup("authenticate test users", async () => {
  await setupTestUsers(baseURL);
});
