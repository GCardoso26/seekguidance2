import { createSupabaseServerClient } from "@/lib/supabase/server";

/** ID do utilizador autenticado via cookies Supabase — nunca confiar em headers do cliente. */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
