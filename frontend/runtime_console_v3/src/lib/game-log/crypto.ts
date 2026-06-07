import type { GameLogEntry, HashableGameLogEntry } from "@/lib/game-log/schema";
import { GENESIS_HASH } from "@/lib/game-log/schema";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

import { sha256Hex } from "@/lib/game-log/sha256";

export function hashEntry(entry: HashableGameLogEntry): string {
  const payload = stableStringify({
    id: entry.id,
    match_id: entry.match_id,
    sequence: entry.sequence,
    timestamp: entry.timestamp,
    actor: entry.actor,
    action: entry.action,
    game_state_snapshot: entry.game_state_snapshot,
    previous_hash: entry.previous_hash,
    metadata: entry.metadata,
  });
  return sha256Hex(payload);
}

export function verifyChain(entries: GameLogEntry[]): boolean {
  let expectedPrevious = GENESIS_HASH;
  for (const entry of [...entries].sort((a, b) => a.sequence - b.sequence)) {
    if (entry.previous_hash !== expectedPrevious) return false;
    const { hash: _stored, ...hashable } = entry;
    const computed = hashEntry(hashable);
    if (entry.hash !== computed) return false;
    expectedPrevious = entry.hash;
  }
  return true;
}

export function newLogEntryId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
