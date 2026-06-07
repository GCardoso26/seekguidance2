import { verifyChain } from "@/lib/game-log/crypto";
import type {
  AnomalyReport,
  GameActionType,
  GameLogEntry,
  GameStateSnapshot,
} from "@/lib/game-log/schema";

type ParsedLogFile = {
  schema_version?: string;
  match_id?: string;
  tcg?: string;
  entries: GameLogEntry[];
};

export class GameLogParser {
  private entries: GameLogEntry[] = [];

  parse(rawLog: string): GameLogEntry[] {
    const parsed = JSON.parse(rawLog) as ParsedLogFile | GameLogEntry[];
    this.entries = Array.isArray(parsed) ? parsed : parsed.entries ?? [];
    return this.getLog();
  }

  load(entries: GameLogEntry[]): GameLogEntry[] {
    this.entries = [...entries].sort((a, b) => a.sequence - b.sequence);
    return this.getLog();
  }

  getLog(): GameLogEntry[] {
    return [...this.entries].sort((a, b) => a.sequence - b.sequence);
  }

  filterByAction(type: GameActionType): GameLogEntry[] {
    return this.entries.filter((e) => e.action.type === type);
  }

  filterByPlayer(playerId: string): GameLogEntry[] {
    return this.entries.filter((e) => e.actor.player_id === playerId);
  }

  filterByPhase(phase: string): GameLogEntry[] {
    return this.entries.filter((e) => e.action.phase === phase);
  }

  getStateAt(sequence: number): GameStateSnapshot | null {
    const entry = this.entries.find((e) => e.sequence === sequence);
    return entry?.game_state_snapshot ?? null;
  }

  findUndoRequests(): GameLogEntry[] {
    return this.entries.filter((e) =>
      ["undo_request", "undo_accept", "undo_reject"].includes(e.action.type),
    );
  }

  detectAnomalies(): AnomalyReport[] {
    const anomalies: AnomalyReport[] = [];
    if (!verifyChain(this.entries)) {
      anomalies.push({
        code: "HASH_CHAIN_BROKEN",
        message: "A cadeia de hashes do log está comprometida.",
        severity: "high",
      });
    }
    for (let i = 1; i < this.entries.length; i++) {
      const prev = this.entries[i - 1];
      const curr = this.entries[i];
      if (curr.timestamp < prev.timestamp) {
        anomalies.push({
          code: "TIMESTAMP_REGRESSION",
          message: `Timestamp regressivo na sequência ${curr.sequence}.`,
          sequence: curr.sequence,
          severity: "medium",
        });
      }
      if (curr.sequence !== prev.sequence + 1) {
        anomalies.push({
          code: "SEQUENCE_GAP",
          message: `Gap de sequência entre ${prev.sequence} e ${curr.sequence}.`,
          sequence: curr.sequence,
          severity: "high",
        });
      }
    }
    const judgeCalls = this.filterByAction("judge_call").length;
    if (judgeCalls > 5) {
      anomalies.push({
        code: "EXCESSIVE_JUDGE_CALLS",
        message: `${judgeCalls} chamadas de juiz na partida.`,
        severity: "low",
      });
    }
    return anomalies;
  }
}
