/** Valida variáveis Supabase para E2E (mensagens acionáveis). */

function jwtRole(key: string): string | null {
  try {
    const segment = key.split(".")[1];
    if (!segment) return null;
    const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { role?: string };
    return json.role ?? null;
  } catch {
    return null;
  }
}

export function hasAuthEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function assertValidE2eAuthEnv(): void {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missing.length > 0) {
    throw new Error(
      `[e2e] Auth setup abortado: falta(m) em frontend/runtime_console_v3/.env.local: ${missing.join(", ")}. Copie de .env.test.example e preencha no Supabase Dashboard — ver docs/E2E_SETUP.md`,
    );
  }

  const anonRole = jwtRole(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  if (anonRole === "service_role") {
    throw new Error(
      "[e2e] NEXT_PUBLIC_SUPABASE_ANON_KEY está com role=service_role. No Supabase Dashboard copie a chave anon/public para NEXT_PUBLIC_SUPABASE_ANON_KEY e mantenha SUPABASE_SERVICE_ROLE_KEY separada.",
    );
  }
}
