import { hashEntry, newLogEntryId, verifyChain } from "@/lib/game-log/crypto";
import type {
  GameActionType,
  GameLogAction,
  GameLogEntry,
  GameLogMetadata,
  GameStateSnapshot,
  LogActor,
  TCGId,
} from "@/lib/game-log/schema";
import { GAME_LOG_SCHEMA_VERSION, GENESIS_HASH } from "@/lib/game-log/schema";

export class GameLogBuilder {
  private entries: GameLogEntry[] = [];
  private sequence = 0;
  private lastHash = GENESIS_HASH;

  constructor(
    readonly matchId: string,
    readonly tcg: TCGId,
    private readonly metadataBase: Partial<GameLogMetadata> = {},
  ) {}

  addEntry(
    type: GameActionType,
    actor: LogActor,
    details: Record<string, unknown>,
    gameState: GameStateSnapshot,
    options?: { phase?: string; turn?: number; timestamp?: number },
  ): GameLogEntry {
    const action: GameLogAction = {
      type,
      tcg: this.tcg,
      phase: options?.phase,
      turn: options?.turn,
      details,
    };

    const draft = {
      id: newLogEntryId(),
      match_id: this.matchId,
      sequence: this.sequence,
      timestamp: options?.timestamp ?? Date.now(),
      actor,
      action,
      game_state_snapshot: gameState,
      previous_hash: this.lastHash,
      hash: "",
      metadata: {
        client_version: this.metadataBase.client_version ?? GAME_LOG_SCHEMA_VERSION,
        platform: this.metadataBase.platform ?? "web",
        latency_ms: this.metadataBase.latency_ms,
      },
    };

    const hash = hashEntry(draft);
    const entry: GameLogEntry = { ...draft, hash };
    this.entries.push(entry);
    this.sequence += 1;
    this.lastHash = hash;
    return entry;
  }

  getLog(): GameLogEntry[] {
    return [...this.entries];
  }

  verifyIntegrity(): boolean {
    return verifyChain(this.entries);
  }

  export(): string {
    return JSON.stringify(
      {
        schema_version: GAME_LOG_SCHEMA_VERSION,
        match_id: this.matchId,
        tcg: this.tcg,
        entries: this.entries,
      },
      null,
      2,
    );
  }
}
