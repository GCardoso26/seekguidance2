import { createChunks, stringToBase64URL } from "@supabase/ssr";
import fs from "fs";
import path from "path";
import { createSupabaseAnonClient, createSupabaseServiceClient } from "./supabase-client";

const AUTH_DIR = path.join(__dirname, "../.auth");

export function hasAuthEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getAdminClient() {
  if (!hasAuthEnv()) return null;
  return createSupabaseServiceClient();
}

async function ensureUser(email: string, password: string, metadata: Record<string, string>) {
  const admin = getAdminClient();
  if (!admin) throw new Error("Missing Supabase admin credentials");

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, ...metadata },
    });
    return existing;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  return data.user;
}

export async function signInAndSaveState(
  email: string,
  password: string,
  outfile: string,
  baseURL: string,
) {
  if (!hasAuthEnv()) return false;

  const anon = createSupabaseAnonClient();
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error ?? new Error("No session");

  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  const hostname = new URL(baseURL).hostname;
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const sessionJson = JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: data.session.token_type,
    user: data.session.user,
  });
  const encoded = `base64-${stringToBase64URL(sessionJson)}`;
  const chunks = createChunks(cookieName, encoded);

  const state = {
    cookies: chunks.map(({ name, value }) => ({
      name,
      value,
      domain: hostname,
      path: "/",
      httpOnly: false,
      secure: baseURL.startsWith("https"),
      sameSite: "Lax" as const,
    })),
    origins: [],
  };

  fs.writeFileSync(path.join(AUTH_DIR, outfile), JSON.stringify(state, null, 2));
  return true;
}

export async function setupTestUsers(baseURL: string) {
  if (!hasAuthEnv()) {
    console.warn(
      "[e2e] Skipping auth setup — configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY",
    );
    return false;
  }

  await ensureUser("test-buyer@judgetcg.com", "TestBuyer123!", {
    name: "Test Buyer",
    full_name: "Test Buyer",
  });
  await ensureUser("test-seller@judgetcg.com", "TestSeller123!", {
    name: "Test Seller",
    full_name: "Test Seller",
  });

  await ensureUser("test-buyer-b@judgetcg.com", "TestBuyerB123!", {
    name: "Test Buyer B",
    full_name: "Test Buyer B",
  });

  // Persona Premium Marcelo TCG (admin@admin.com)
  try {
    const { PERSONA_EMAIL, PERSONA_PASSWORD, PERSONA_DISPLAY_NAME } = await import(
      "../../src/lib/e2e-persona-marcelo"
    );
    await ensureUser(PERSONA_EMAIL, PERSONA_PASSWORD, {
      name: PERSONA_DISPLAY_NAME,
      full_name: PERSONA_DISPLAY_NAME,
    });
    await signInAndSaveState(PERSONA_EMAIL, PERSONA_PASSWORD, "seller-persona.json", baseURL);
  } catch (err) {
    console.warn("[e2e] Persona Marcelo auth state skipped:", err);
  }

  await signInAndSaveState("test-buyer@judgetcg.com", "TestBuyer123!", "buyer.json", baseURL);
  await signInAndSaveState("test-buyer-b@judgetcg.com", "TestBuyerB123!", "buyer-b.json", baseURL);
  await signInAndSaveState("test-seller@judgetcg.com", "TestSeller123!", "seller.json", baseURL);
  return true;
}
