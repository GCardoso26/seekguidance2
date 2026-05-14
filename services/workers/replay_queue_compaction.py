"""Compactação lógica da fila de replay (dedupe de job ids)."""

from __future__ import annotations


def compact_replay_queue_ids(job_ids: list[str], *, max_unique: int) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for j in job_ids:
        if j in seen:
            continue
        seen.add(j)
        out.append(j)
        if len(out) >= max_unique:
            break
    return out
