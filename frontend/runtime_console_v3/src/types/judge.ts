export type TcgType =
  | "magic"
  | "pokemon"
  | "yugioh"
  | "lorcana"
  | "one_piece"
  | "flesh_and_blood"
  | "gundam"
  | "digimon"
  | "dragon_ball"
  | "sorcery"
  | "vanguard"
  | "riftbound"
  | "union_arena";

export type TcgOption = {
  id: TcgType;
  label: string;
  enabled: boolean;
};

export const TCG_OPTIONS: TcgOption[] = [
  { id: "magic", label: "Magic: The Gathering", enabled: true },
  { id: "pokemon", label: "Pokémon TCG", enabled: true },
  { id: "lorcana", label: "Disney Lorcana", enabled: true },
  { id: "yugioh", label: "Yu-Gi-Oh!", enabled: true },
  { id: "one_piece", label: "One Piece TCG", enabled: true },
  { id: "flesh_and_blood", label: "Flesh and Blood", enabled: true },
  { id: "gundam", label: "Gundam Card Game", enabled: true },
  { id: "digimon", label: "Digimon TCG", enabled: true },
  { id: "dragon_ball", label: "Dragon Ball Super Fusion World", enabled: true },
  { id: "sorcery", label: "Sorcery: Contested Realm", enabled: true },
  { id: "vanguard", label: "Cardfight!! Vanguard", enabled: true },
  { id: "riftbound", label: "Riftbound — League of Legends", enabled: true },
  { id: "union_arena", label: "Union Arena", enabled: true },
];

export type JudgeQuestion = {
  tcg: TcgType;
  question: string;
};

export type JudgeSource = {
  title: string;
  url: string;
  section?: string | null;
  excerpt?: string | null;
};

export type JudgeResponse = {
  success: boolean;
  answer: string;
  confidence: number;
  sources: JudgeSource[];
  runtime_confidence: number;
  integrity_status?: string;
  verdict?: string | null;
  rule_applied?: string | null;
  explanation?: string | null;
  exceptions?: string | null;
};

export type JudgeQuestionPayload = JudgeQuestion & {
  context?: string;
};

export type JudgeHistoryItem = {
  id: string;
  tcg: TcgType;
  question: string;
  answer: string;
  success: boolean;
  confidence: number;
  sources?: JudgeSource[];
  runtime_confidence?: number;
  verdict?: string | null;
  rule_applied?: string | null;
  explanation?: string | null;
  exceptions?: string | null;
  createdAt: string;
};

export type BackendHealthState = "online" | "degraded" | "offline";
