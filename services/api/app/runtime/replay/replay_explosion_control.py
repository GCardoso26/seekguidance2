"""Controlo de explosão / dedupe em replays (bounded, determinístico)."""

from __future__ import annotations

from typing import Any

from app.runtime.replay.replay_hashing import deterministic_hash

EventDict = dict[str, Any]


def replay_dedupe_events(
    events: list[EventDict],
    *,
    max_events: int = 512,
) -> tuple[list[EventDict], dict[str, Any]]:
    seen: set[str] = set()
    out: list[EventDict] = []
    for e in events[: max_events * 2]:
        h = deterministic_hash(e)
        if h in seen:
            continue
        seen.add(h)
        out.append(e)
        if len(out) >= max_events:
            break
    return out, {"unique": len(out), "input": len(events)}


def replay_equivalence_collapse(payloads: list[dict[str, Any]]) -> dict[str, Any]:
    hashes = [deterministic_hash(p) for p in payloads]
    uniq = len(set(hashes))
    return {"classes": uniq, "total": len(payloads), "collapsed": len(payloads) - uniq}
