import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockSubscribePush } from "@/lib/notifications-mock";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ detail: "Autenticação indisponível" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  const raw = (await req.json()) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };

  if (!raw.endpoint) {
    return NextResponse.json({ detail: "endpoint obrigatório" }, { status: 400 });
  }

  const body = JSON.stringify({
    endpoint: raw.endpoint,
    keys: raw.keys ?? {},
  });

  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/notifications/push/subscribe`, {
      method: "POST",
      headers: await tournamentProxyHeaders(req),
      body,
      cache: "no-store",
    });
    if (res.ok) {
      const text = await res.text();
      return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    // stub
  }

  const record = mockSubscribePush(user.id, {
    endpoint: raw.endpoint,
    keys: raw.keys,
  });
  return NextResponse.json({ ok: true, subscription: record });
}
