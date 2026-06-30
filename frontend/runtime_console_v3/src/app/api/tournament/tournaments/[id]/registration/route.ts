import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTournamentRegistrationPayload } from "@/lib/tournament-registration";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabaseAuth = await createSupabaseServerClient();
  if (!supabaseAuth) {
    return NextResponse.json({ detail: "Autenticação indisponível" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = parseTournamentRegistrationPayload(raw);
  if (!parsed.success) {
    return NextResponse.json({ detail: "Dados inválidos" }, { status: 400 });
  }

  const accountRes = await fetch(`${req.nextUrl.origin}/api/account/status`, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (accountRes.ok) {
    const account = (await accountRes.json()) as { player?: { can_purchase?: boolean } };
    if (!account.player?.can_purchase) {
      return NextResponse.json({ detail: "CPF ativo obrigatório para inscrição" }, { status: 403 });
    }
  }

  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/tournaments/${id}/register`, {
      method: "POST",
      headers: await tournamentProxyHeaders(req),
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabaseAuth = await createSupabaseServerClient();
  if (!supabaseAuth) {
    return NextResponse.json({ detail: "Autenticação indisponível" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  }

  const { getTcgJudgeDb } = await import("@/lib/tournament-registration-bff");
  const db = getTcgJudgeDb();
  if (!db) {
    return NextResponse.json({ detail: "Banco indisponível" }, { status: 503 });
  }

  const { data: participant } = await db
    .from("tournament_participants")
    .select("id, status")
    .eq("tournament_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) {
    await db
      .from("tournament_payments")
      .update({ status: "failed" })
      .eq("tournament_id", id)
      .eq("player_id", user.id)
      .eq("status", "pending");
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  if (!["registered", "checked_in"].includes(String(participant.status))) {
    return NextResponse.json({ detail: "Não é possível cancelar neste status" }, { status: 400 });
  }

  await db
    .from("tournament_participants")
    .update({ status: "dropped", dropped_at: new Date().toISOString() })
    .eq("id", participant.id);

  return NextResponse.json({ ok: true, status: "cancelled" });
}
