import { z } from "zod";
import type {
  TournamentParticipantStatus,
  TournamentPaymentStatus,
  TournamentPublicStatus,
  TournamentRegistrationStatus,
} from "@/types/tournament-registration";

export const REGISTRATION_OPEN_STATUSES = new Set([
  "published",
  "registration_open",
  "open",
]);

export const PAYMENT_PENDING_MINUTES = 30;

export const tournamentRegistrationPayloadSchema = z.object({
  display_name: z.string().trim().min(2).max(80).optional(),
});

export type TournamentRegistrationPayloadInput = z.infer<typeof tournamentRegistrationPayloadSchema>;

export function parseTournamentRegistrationPayload(data: unknown) {
  return tournamentRegistrationPayloadSchema.safeParse(data);
}

export function mapTournamentPublicStatus(status: string): TournamentPublicStatus {
  if (REGISTRATION_OPEN_STATUSES.has(status)) return "open";
  if (status === "check_in" || status === "draft") return "closed";
  if (status === "in_progress" || status === "swiss_active" || status === "bracket_active") {
    return "in_progress";
  }
  if (status === "finalized" || status === "completed" || status === "bracket_complete") {
    return "finished";
  }
  return "closed";
}

export function publicStatusLabel(status: TournamentPublicStatus): string {
  switch (status) {
    case "open":
      return "Inscrições abertas";
    case "closed":
      return "Inscrições fechadas";
    case "in_progress":
      return "Em andamento";
    case "finished":
      return "Finalizado";
  }
}

export function isPaymentExpired(createdAt: string | null | undefined, now = Date.now()): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return now - created > PAYMENT_PENDING_MINUTES * 60 * 1000;
}

export function resolveRegistrationStatus(input: {
  participantStatus?: TournamentParticipantStatus | null;
  paymentStatus?: TournamentPaymentStatus | null;
  paymentCreatedAt?: string | null;
}): TournamentRegistrationStatus {
  const { participantStatus, paymentStatus, paymentCreatedAt } = input;

  if (participantStatus === "dropped" || participantStatus === "disqualified") {
    return "cancelled";
  }

  if (
    participantStatus === "registered" ||
    participantStatus === "checked_in" ||
    participantStatus === "active"
  ) {
    return "confirmed";
  }

  if (paymentStatus === "pending") {
    if (isPaymentExpired(paymentCreatedAt)) return "cancelled";
    return "pending_payment";
  }

  return "not_registered";
}

export function canRegister(input: {
  tournamentStatus: string;
  registeredCount: number;
  maxPlayers: number | null;
  registrationStatus: TournamentRegistrationStatus;
  isLoggedIn: boolean;
  canPurchase: boolean;
}): { allowed: boolean; reason?: string } {
  if (!input.isLoggedIn) {
    return { allowed: false, reason: "login_required" };
  }
  if (!input.canPurchase) {
    return { allowed: false, reason: "cpf_required" };
  }
  if (!REGISTRATION_OPEN_STATUSES.has(input.tournamentStatus)) {
    return { allowed: false, reason: "registration_closed" };
  }
  if (input.registrationStatus === "confirmed" || input.registrationStatus === "pending_payment") {
    return { allowed: false, reason: "already_registered" };
  }
  if (input.maxPlayers != null && input.registeredCount >= input.maxPlayers) {
    return { allowed: false, reason: "full" };
  }
  return { allowed: true };
}

export function formatAnonymousPlayer(index: number): string {
  return `Jogador #${index + 1}`;
}

export function registrationStatusLabel(status: TournamentRegistrationStatus): string {
  switch (status) {
    case "not_registered":
      return "Não inscrito";
    case "pending_payment":
      return "Aguardando pagamento";
    case "confirmed":
      return "Inscrito";
    case "cancelled":
      return "Cancelado";
  }
}

export function participantStatusLabel(status: TournamentParticipantStatus): string {
  switch (status) {
    case "registered":
      return "Confirmado";
    case "checked_in":
      return "Check-in";
    case "active":
      return "Ativo";
    case "dropped":
      return "Cancelado";
    case "disqualified":
      return "Desclassificado";
  }
}

export function paymentStatusLabel(status: TournamentPaymentStatus | null | undefined): string {
  if (!status) return "—";
  switch (status) {
    case "pending":
      return "Pendente";
    case "paid":
      return "Pago";
    case "refunded":
      return "Reembolsado";
    case "partial_refund":
      return "Reembolso parcial";
    case "failed":
      return "Falhou";
  }
}

export function participantsToCsv(rows: Array<Record<string, string | number | null>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number | null) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h] ?? null)).join(","))].join(
    "\n",
  );
}
