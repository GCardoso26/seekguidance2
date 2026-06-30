import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTcgJudgeDb, isTournamentOrganizer } from "@/lib/tournament-registration-bff";

type Params = { params: Promise<{ id: string; participantId: string }> };

const ALLOWED_ACTIONS = new Set(["confirm", "cancel", "mark_paid"]);

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, participantId } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  const action = body.action ?? "";

  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ detail: "Ação inválida" }, { status: 400 });
  }

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

  const db = getTcgJudgeDb();
  if (!db) {
    return NextResponse.json({ detail: "Banco indisponível" }, { status: 503 });
  }

  const organizer = await isTournamentOrganizer(db, id, user.id);
  if (!organizer) {
    return NextResponse.json({ detail: "Apenas o organizador" }, { status: 403 });
  }

  const { data: participant } = await db
    .from("tournament_participants")
    .select("id, user_id, status")
    .eq("id", participantId)
    .eq("tournament_id", id)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json({ detail: "Participante não encontrado" }, { status: 404 });
  }

  if (action === "confirm") {
    await db
      .from("tournament_participants")
      .update({ status: "registered" })
      .eq("id", participantId);
  } else if (action === "cancel") {
    await db
      .from("tournament_participants")
      .update({ status: "dropped", dropped_at: new Date().toISOString() })
      .eq("id", participantId);
  } else if (action === "mark_paid") {
    await db
      .from("tournament_payments")
      .upsert(
        {
          tournament_id: id,
          player_id: participant.user_id,
          amount_cents: 0,
          platform_fee_cents: 0,
          organizer_receives_cents: 0,
          status: "paid",
          paid_at: new Date().toISOString(),
        },
        { onConflict: "tournament_id,player_id" },
      );
  }

  return NextResponse.json({ ok: true, action });
}
