import { describe, expect, it } from "vitest";
import { hashEntry, verifyChain } from "@/lib/game-log/crypto";
import { GENESIS_HASH } from "@/lib/game-log/schema";
import type { HashableGameLogEntry } from "@/lib/game-log/schema";

function baseEntry(seq: number, prev: string): HashableGameLogEntry {
  return {
    id: `id-${seq}`,
    match_id: "match-1",
    sequence: seq,
    timestamp: 1_700_000_000_000 + seq,
    actor: { player_id: "p1", player_name: "A", seat: 1 },
    action: { type: "turn_start", tcg: "lorcana", details: {} },
    game_state_snapshot: { zones: [] },
    previous_hash: prev,
    hash: "",
    metadata: { client_version: "1.0", platform: "web" },
  };
}

describe("game-log crypto", () => {
  it("hashEntry é determinístico", () => {
    const e = baseEntry(0, GENESIS_HASH);
    expect(hashEntry(e)).toBe(hashEntry(e));
  });

  it("verifyChain aceita cadeia válida", () => {
    const e0 = baseEntry(0, GENESIS_HASH);
    const h0 = hashEntry(e0);
    const e1 = baseEntry(1, h0);
    const h1 = hashEntry(e1);
    expect(verifyChain([{ ...e0, hash: h0 }, { ...e1, hash: h1 }])).toBe(true);
  });

  it("verifyChain rejeita hash adulterado", () => {
    const e0 = baseEntry(0, GENESIS_HASH);
    const h0 = hashEntry(e0);
    expect(verifyChain([{ ...e0, hash: "deadbeef" }])).toBe(false);
  });
});
