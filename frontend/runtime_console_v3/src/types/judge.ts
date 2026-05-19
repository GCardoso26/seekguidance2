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
  { id: "flesh_and_blood", label: "Flesh and Blood", enabled: false },
  { id: "gundam", label: "Gundam", enabled: false },
  { id: "digimon", label: "Digimon TCG", enabled: false },
  { id: "dragon_ball", label: "Dragon Ball Super Fusion World", enabled: false },
  { id: "sorcery", label: "Sorcery: Contested Realm", enabled: false },
  { id: "vanguard", label: "Cardfight!! Vanguard", enabled: false },
  { id: "riftbound", label: "Riftbound — League of Legends", enabled: false },
  { id: "union_arena", label: "Union Arena", enabled: false },
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
};

export type JudgeHistoryItem = {
  id: string;
  tcg: TcgType;
  question: string;
  answer: string;
  success: boolean;
  confidence: number;
  createdAt: string;
};

export type BackendHealthState = "online" | "degraded" | "offline";
