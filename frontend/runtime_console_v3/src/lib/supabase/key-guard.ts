/**
 * Garante que NEXT_PUBLIC_SUPABASE_ANON_KEY não é service_role (bypass de RLS).
 * service_role pertence apenas ao backend (Render), nunca ao bundle Next.js.
 */
export function assertAnonSupabaseKey(key: string): void {
  try {
    const segment = key.split(".")[1];
    if (!segment) return;
    const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(padded)) as { role?: string };
    if (json.role !== "service_role") return;
    const msg =
      "NEXT_PUBLIC_SUPABASE_ANON_KEY usa role=service_role. No Supabase Dashboard use a chave anon/public.";
    // Fail-closed em qualquer ambiente — service_role no FE é P0.
    throw new Error(msg);
  } catch (err) {
    if (err instanceof Error && err.message.includes("service_role")) {
      throw err;
    }
  }
}
