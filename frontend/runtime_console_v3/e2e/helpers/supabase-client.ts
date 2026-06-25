import { createClient } from "@supabase/supabase-js";
import ws from "ws";

/** Node < 22 (ex.: CI com Node 20) não expõe WebSocket global — exigido pelo @supabase/realtime-js. */
const nodeClientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
} as const;

export function createSupabaseServiceClient(schema?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      ...nodeClientOptions,
      ...(schema ? { db: { schema } } : {}),
    },
  );
}

export function createSupabaseAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    nodeClientOptions,
  );
}
