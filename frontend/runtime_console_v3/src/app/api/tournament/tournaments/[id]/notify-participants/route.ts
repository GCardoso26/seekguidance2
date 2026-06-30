import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTcgJudgeDb, isTournamentOrganizer } from "@/lib/tournament-registration-bff";

type Params = { params: Promise<{ id: string }> };

/** Stub: notifica inscritos via FCM/email quando backend estiver disponível. */
export async function POST(_req: NextRequest, { params }: Params) {
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

  const db = getTcgJudgeDb();
  if (!db) {
    return NextResponse.json({ queued: true, stub: true, tournament_id: id });
  }

  const organizer = await isTournamentOrganizer(db, id, user.id);
  if (!organizer) {
    return NextResponse.json({ detail: "Apenas o organizador" }, { status: 403 });
  }

  const { count } = await db
    .from("tournament_participants")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", id)
    .in("status", ["registered", "checked_in", "active"]);

  return NextResponse.json({
    queued: true,
    stub: true,
    tournament_id: id,
    recipient_count: count ?? 0,
    message: "Notificação enfileirada (stub até integração FCM/email)",
  });
}
