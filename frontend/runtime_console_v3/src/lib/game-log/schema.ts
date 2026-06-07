export const GAME_LOG_SCHEMA_VERSION = "1.0.0";

export const GENESIS_HASH = "0".repeat(64);

export type TCGId =
  | "lorcana"
  | "pokemon"
  | "one_piece"
  | "union_arena"
  | "digimon"
  | "dbs_fusion_world"
  | "vanguard"
  | "gundam"
  | "swu"
  | "sorcery"
  | "riftbound"
  | "yugioh"
  | "mtg";

export type GameActionType =
  | "game_start"
  | "turn_start"
  | "phase_change"
  | "draw"
  | "play_card"
  | "activate_ability"
  | "attack"
  | "block"
  | "damage"
  | "destroy"
  | "search_deck"
  | "shuffle"
  | "reveal"
  | "counter"
  | "chain_link"
  | "pass_priority"
  | "sideboard"
  | "game_end"
  | "undo_request"
  | "undo_accept"
  | "undo_reject"
  | "judge_call"
  | "chat_message";

export type ZoneType =
  | "deck"
  | "hand"
  | "field"
  | "graveyard"
  | "banished"
  | "sideboard"
  | "stack"
  | "command"
  | "security"
  | "damage_zone"
  | "bond_area"
  | "mana_zone"
  | "custom";

export interface LogActor {
  player_id: string;
  player_name: string;
  seat: 1 | 2;
}

export interface CardSnapshot {
  instance_id: string;
  definition_id: string;
  name: string;
  face_up: boolean;
  tapped?: boolean;
  counters?: Record<string, number>;
  attachments?: CardSnapshot[];
  modifiers?: string[];
  zone_position?: number;
}

export interface ZoneState {
  id: string;
  type: ZoneType;
  owner?: string;
  cards: CardSnapshot[];
  is_public: boolean;
  is_ordered: boolean;
}

export interface GameStateSnapshot {
  zones: ZoneState[];
  life_totals?: Record<string, number>;
  counters?: Record<string, number>;
  custom_state?: Record<string, unknown>;
}

export interface GameLogAction {
  type: GameActionType;
  tcg: TCGId;
  phase?: string;
  turn?: number;
  details: Record<string, unknown>;
}

export interface GameLogMetadata {
  client_version: string;
  platform: "web" | "mobile";
  latency_ms?: number;
}

export interface GameLogEntry {
  id: string;
  match_id: string;
  sequence: number;
  timestamp: number;
  actor: LogActor;
  action: GameLogAction;
  game_state_snapshot: GameStateSnapshot;
  previous_hash: string;
  hash: string;
  metadata: GameLogMetadata;
}

export type AnomalyReport = {
  code: string;
  message: string;
  sequence?: number;
  severity: "low" | "medium" | "high";
};

export type HashableGameLogEntry = Omit<GameLogEntry, "hash">;
