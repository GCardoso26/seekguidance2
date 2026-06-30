export type TournamentRegistrationStatus =
  | "not_registered"
  | "pending_payment"
  | "confirmed"
  | "cancelled";

export type TournamentParticipantStatus =
  | "registered"
  | "checked_in"
  | "active"
  | "dropped"
  | "disqualified";

export type TournamentPaymentStatus =
  | "pending"
  | "paid"
  | "refunded"
  | "failed"
  | "partial_refund";

export type TournamentPublicStatus = "open" | "closed" | "in_progress" | "finished";

export type TournamentRegistrationPayload = {
  display_name?: string;
};

export type TournamentRegistrationStatusResponse = {
  status: TournamentRegistrationStatus;
  participant_id?: string | null;
  payment_status?: TournamentPaymentStatus | null;
  payment_expires_at?: string | null;
  can_cancel?: boolean;
};

export type TournamentParticipantRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  status: TournamentParticipantStatus;
  created_at: string;
  payment_status?: TournamentPaymentStatus | null;
  payment_amount_cents?: number | null;
};

export type TournamentParticipantsPublicResponse = {
  registered_count: number;
  max_players: number | null;
  players: Array<{ label: string; status: TournamentParticipantStatus }>;
};

export type TournamentParticipantsAdminResponse = {
  participants: TournamentParticipantRow[];
  total: number;
};
