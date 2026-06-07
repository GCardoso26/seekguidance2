export type InfractionType =
  | "slow_play"
  | "deck_error"
  | "marked_cards"
  | "insufficient_shuffling"
  | "communication_error"
  | "game_rule_violation"
  | "illegal_play"
  | "illegal_chain"
  | "illegal_summon"
  | "illegal_ride"
  | "drive_check_error"
  | "security_error"
  | "bounty_error"
  | "illegal_movement"
  | "cheating"
  | "outside_assistance"
  | "unsporting_conduct"
  | "improperly_determining_winner"
  | "other";

export type InfractionSeverity = "minor" | "major" | "severe";
export type InfractionCategory = "procedural" | "gameplay" | "ethical";
export type InfractionStatus = "open" | "investigating" | "resolved" | "appealed" | "closed";

export type PenaltyType = "warning" | "game_loss" | "match_loss" | "disqualification" | "ban";

export type Penalty = {
  type: PenaltyType;
  duration?: string;
  reason: string;
};

export type InfractionReport = {
  id: string;
  match_id: string;
  tournament_id?: string;
  match_tcg?: string;
  reported_by: string;
  reported_by_seat: 1 | 2;
  target_player?: string;
  target_player_seat?: 1 | 2;
  type: InfractionType;
  severity: InfractionSeverity;
  category: InfractionCategory;
  description: string;
  evidence?: {
    log_sequences?: number[];
    screenshots?: string[];
    chat_messages?: string[];
  };
  status: InfractionStatus;
  assigned_judge?: string;
  resolution?: {
    ruling_applied?: string;
    penalty?: Penalty;
    judge_notes: string;
    resolved_at: string;
    resolved_by: string;
  };
  appeal?: {
    reason: string;
    requested_at: string;
    status: "pending" | "accepted" | "rejected";
    reviewed_by?: string;
    review_notes?: string;
  };
  reported_at: string;
  first_response_at?: string;
  resolved_at?: string;
  sla_deadline: string;
  created_at: string;
  updated_at: string;
};

export type CreateInfractionDTO = {
  match_id: string;
  tournament_id?: string;
  reported_by: string;
  reported_by_seat: 1 | 2;
  target_player?: string;
  target_player_seat?: 1 | 2;
  type?: InfractionType;
  description: string;
  evidence?: InfractionReport["evidence"];
};

export type TournamentLevel = "casual" | "regular" | "competitive";
