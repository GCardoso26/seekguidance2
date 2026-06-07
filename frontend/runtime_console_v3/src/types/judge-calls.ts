export type JudgeCallType =
  | "rules_question"
  | "dispute"
  | "cheating_suspicion"
  | "slow_play"
  | "unsporting_conduct"
  | "deck_error"
  | "other";

export type JudgeCallPriority = "low" | "medium" | "high" | "urgent";

export type JudgeCallStatus = "open" | "assigned" | "resolved" | "escalated" | "dismissed";

export type RulingCategory =
  | "warning"
  | "game_loss"
  | "match_loss"
  | "disqualification"
  | "none"
  | "rule_clarification";

export type JudgeCall = {
  id: string;
  tournamentId: string;
  roundId?: string | null;
  tableNumber: number;
  callerId?: string | null;
  type: JudgeCallType;
  priority: JudgeCallPriority;
  status: JudgeCallStatus;
  description: string;
  evidenceUrls: string[];
  assignedJudgeId?: string | null;
  ruling?: string | null;
  rulingCategory?: RulingCategory | null;
  createdAt: string;
  assignedAt?: string | null;
  resolvedAt?: string | null;
  tournamentName?: string | null;
  tournamentGameCode?: string | null;
  callerHandle?: string | null;
  roundNumber?: number | null;
};

export type JudgeCertification = {
  id: string;
  playerId: string;
  gameCode: string;
  level: "level1" | "level2" | "level3";
  status: string;
  certifiedAt: string;
  expiresAt?: string | null;
};

export function mapJudgeCall(raw: Record<string, unknown>): JudgeCall {
  return {
    id: String(raw.id),
    tournamentId: String(raw.tournament_id ?? raw.tournamentId),
    roundId: (raw.round_id ?? raw.roundId) as string | null | undefined,
    tableNumber: Number(raw.table_number ?? raw.tableNumber),
    callerId: (raw.caller_id ?? raw.callerId) as string | null | undefined,
    type: raw.type as JudgeCallType,
    priority: raw.priority as JudgeCallPriority,
    status: raw.status as JudgeCallStatus,
    description: String(raw.description),
    evidenceUrls: (raw.evidence_urls ?? raw.evidenceUrls ?? []) as string[],
    assignedJudgeId: (raw.assigned_judge_id ?? raw.assignedJudgeId) as string | null | undefined,
    ruling: (raw.ruling as string | null) ?? null,
    rulingCategory: (raw.ruling_category ?? raw.rulingCategory) as RulingCategory | null | undefined,
    createdAt: String(raw.created_at ?? raw.createdAt),
    assignedAt: (raw.assigned_at ?? raw.assignedAt) as string | null | undefined,
    resolvedAt: (raw.resolved_at ?? raw.resolvedAt) as string | null | undefined,
    tournamentName: (raw.tournament_name ?? raw.tournamentName) as string | null | undefined,
    tournamentGameCode: (raw.tournament_game_code ?? raw.tournamentGameCode) as string | null | undefined,
    callerHandle: (raw.caller_handle ?? raw.callerHandle) as string | null | undefined,
    roundNumber: (raw.round_number ?? raw.roundNumber) as number | null | undefined,
  };
}

export function mapJudgeCertification(raw: Record<string, unknown>): JudgeCertification {
  return {
    id: String(raw.id),
    playerId: String(raw.player_id ?? raw.playerId),
    gameCode: String(raw.game_code ?? raw.gameCode),
    level: raw.level as JudgeCertification["level"],
    status: String(raw.status),
    certifiedAt: String(raw.certified_at ?? raw.certifiedAt),
    expiresAt: (raw.expires_at ?? raw.expiresAt) as string | null | undefined,
  };
}

export const CALL_TYPE_LABELS: Record<JudgeCallType, string> = {
  rules_question: "Dúvida de Regra",
  dispute: "Disputa",
  cheating_suspicion: "Suspeita de Trapaça",
  slow_play: "Slow Play",
  unsporting_conduct: "Conduta Anti-Esportiva",
  deck_error: "Erro de Deck",
  other: "Outro",
};

export const PRIORITY_COLORS: Record<JudgeCallPriority, string> = {
  low: "bg-slate-500/20 text-slate-300",
  medium: "bg-amber-500/20 text-amber-200",
  high: "bg-orange-500/20 text-orange-200",
  urgent: "bg-red-500/20 text-red-300",
};
