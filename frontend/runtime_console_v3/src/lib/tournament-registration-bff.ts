import { createClient } from "@supabase/supabase-js";
import {
  formatAnonymousPlayer,
  isPaymentExpired,
  resolveRegistrationStatus,
} from "@/lib/tournament-registration";
import type {
  TournamentParticipantRow,
  TournamentParticipantsAdminResponse,
  TournamentParticipantsPublicResponse,
  TournamentRegistrationStatusResponse,
} from "@/types/tournament-registration";

export function getTcgJudgeDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { db: { schema: "tcg_judge" } });
}

type ParticipantRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  status: string;
  created_at: string;
};

type PaymentRow = {
  status: string;
  created_at: string;
  amount_cents: number;
};

type TcgJudgeDb = NonNullable<ReturnType<typeof getTcgJudgeDb>>;

export async function fetchRegistrationStatus(
  db: TcgJudgeDb,
  tournamentId: string,
  userId: string,
): Promise<TournamentRegistrationStatusResponse> {
  const [{ data: participant }, { data: payment }] = await Promise.all([
    db
      .from("tournament_participants")
      .select("id, status")
      .eq("tournament_id", tournamentId)
      .eq("user_id", userId)
      .maybeSingle(),
    db
      .from("tournament_payments")
      .select("status, created_at")
      .eq("tournament_id", tournamentId)
      .eq("player_id", userId)
      .maybeSingle(),
  ]);

  const pRow = participant as ParticipantRow | null;
  const payRow = payment as PaymentRow | null;

  const status = resolveRegistrationStatus({
    participantStatus: pRow?.status as never,
    paymentStatus: payRow?.status as never,
    paymentCreatedAt: payRow?.created_at,
  });

  let paymentExpiresAt: string | null = null;
  if (payRow?.status === "pending" && payRow.created_at) {
    paymentExpiresAt = new Date(
      new Date(payRow.created_at).getTime() + 30 * 60 * 1000,
    ).toISOString();
    if (isPaymentExpired(payRow.created_at) && status === "cancelled") {
      await db
        .from("tournament_payments")
        .update({ status: "failed" })
        .eq("tournament_id", tournamentId)
        .eq("player_id", userId)
        .eq("status", "pending");
    }
  }

  return {
    status,
    participant_id: pRow?.id ?? null,
    payment_status: (payRow?.status as never) ?? null,
    payment_expires_at: paymentExpiresAt,
    can_cancel:
      status === "confirmed" &&
      (pRow?.status === "registered" || pRow?.status === "checked_in"),
  };
}

export async function fetchPublicParticipants(
  db: TcgJudgeDb,
  tournamentId: string,
  maxPlayers: number | null,
): Promise<TournamentParticipantsPublicResponse> {
  const { data } = await db
    .from("tournament_participants")
    .select("status")
    .eq("tournament_id", tournamentId)
    .in("status", ["registered", "checked_in", "active"])
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as Array<{ status: string }>;
  return {
    registered_count: rows.length,
    max_players: maxPlayers,
    players: rows.map((row, index) => ({
      label: formatAnonymousPlayer(index),
      status: row.status as never,
    })),
  };
}

export async function fetchAdminParticipants(
  db: TcgJudgeDb,
  tournamentId: string,
): Promise<TournamentParticipantsAdminResponse> {
  const { data: participants } = await db
    .from("tournament_participants")
    .select("id, user_id, display_name, status, created_at")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });

  const { data: payments } = await db
    .from("tournament_payments")
    .select("player_id, status, amount_cents")
    .eq("tournament_id", tournamentId);

  const payMap = new Map(
    ((payments ?? []) as Array<{ player_id: string; status: string; amount_cents: number }>).map((p) => [
      p.player_id,
      p,
    ]),
  );

  const rows: TournamentParticipantRow[] = ((participants ?? []) as ParticipantRow[]).map((p) => {
    const pay = payMap.get(p.user_id);
    return {
      id: p.id,
      user_id: p.user_id,
      display_name: p.display_name,
      status: p.status as never,
      created_at: p.created_at,
      payment_status: (pay?.status as never) ?? null,
      payment_amount_cents: pay?.amount_cents ?? null,
    };
  });

  return { participants: rows, total: rows.length };
}

export async function isTournamentOrganizer(
  db: TcgJudgeDb,
  tournamentId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await db
    .from("tournaments")
    .select("created_by")
    .eq("id", tournamentId)
    .maybeSingle();
  return Boolean(data && String((data as { created_by: string }).created_by) === userId);
}

export function registrationStatusMock(userId?: string): TournamentRegistrationStatusResponse {
  if (!userId) {
    return { status: "not_registered", can_cancel: false };
  }
  return { status: "not_registered", can_cancel: false };
}

export function publicParticipantsMock(): TournamentParticipantsPublicResponse {
  return {
    registered_count: 2,
    max_players: 32,
    players: [
      { label: "Jogador #1", status: "registered" },
      { label: "Jogador #2", status: "registered" },
    ],
  };
}
