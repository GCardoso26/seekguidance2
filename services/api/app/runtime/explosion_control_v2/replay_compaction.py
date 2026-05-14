"""Compactação lógica de replays (lista de hashes determinísticos)."""

from __future__ import annotations


def compact_replay_hashes(hashes: list[str], *, max_keep: int) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for h in hashes:
        if h in seen:
            continue
        seen.add(h)
        out.append(h)
        if len(out) >= max_keep:
            break
    return out
