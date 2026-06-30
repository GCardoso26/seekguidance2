import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockUnsubscribePush } from "@/lib/notifications-mock";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ detail: "Autenticação indisponível" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!body.endpoint) {
    return NextResponse.json({ detail: "endpoint obrigatório" }, { status: 400 });
  }

  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/notifications/push/unsubscribe`, {
      method: "POST",
      headers: await tournamentProxyHeaders(req),
      body: JSON.stringify({ endpoint: body.endpoint }),
      cache: "no-store",
    });
    if (res.ok) {
      const text = await res.text();
      return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    // stub
  }

  mockUnsubscribePush(user.id, body.endpoint);
  return NextResponse.json({ ok: true });
}
