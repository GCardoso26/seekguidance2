import type { TcgType } from "@/types/judge";

/** Alinhado com plano Free — escolha no onboarding. */
export const FREE_TCG_SELECTION_LIMIT = 5;

export const FREE_DAILY_QUESTIONS = 50;

/** Fallback antes do onboarding ou perfil legado sem favorite_tcgs. */
export const FREE_TCG_IDS: TcgType[] = ["magic", "pokemon", "yugioh", "lorcana", "one_piece"];
