import type { TcgType } from "@/types/judge";

/** Alinhado com plano Free — escolha no onboarding. */
export const FREE_TCG_SELECTION_LIMIT = 5;

export const FREE_DAILY_QUESTIONS = 50;

/** Torneios criados por mês no plano Free. */
export const FREE_TOURNAMENTS_PER_MONTH = 1;

/** Histórico local no Free (consultas guardadas no browser). */
export const FREE_LOCAL_HISTORY_LIMIT = 10;

export type PlanFeature = "consultas" | "tcgs" | "historico" | "torneios" | "export";

export type PlanTier = "free" | "pro" | "team";

export const PLAN_LIMITS: Record<PlanTier, Record<PlanFeature, number>> = {
  free: {
    consultas: FREE_DAILY_QUESTIONS,
    tcgs: FREE_TCG_SELECTION_LIMIT,
    historico: FREE_LOCAL_HISTORY_LIMIT,
    torneios: FREE_TOURNAMENTS_PER_MONTH,
    export: 0,
  },
  pro: {
    consultas: Number.POSITIVE_INFINITY,
    tcgs: 14,
    historico: Number.POSITIVE_INFINITY,
    torneios: Number.POSITIVE_INFINITY,
    export: Number.POSITIVE_INFINITY,
  },
  team: {
    consultas: Number.POSITIVE_INFINITY,
    tcgs: 14,
    historico: Number.POSITIVE_INFINITY,
    torneios: Number.POSITIVE_INFINITY,
    export: Number.POSITIVE_INFINITY,
  },
};

/** Fallback antes do onboarding ou perfil legado sem favorite_tcgs. */
export const FREE_TCG_IDS: TcgType[] = ["magic", "pokemon", "yugioh", "lorcana", "one_piece"];
