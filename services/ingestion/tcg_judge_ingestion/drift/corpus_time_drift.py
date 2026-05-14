"""Drift de corpus (ingestão) — séries temporais e deltas semânticos (stub)."""

from __future__ import annotations

from typing import Any


def semantic_drift_score(prev_hash: str, curr_hash: str) -> float:
    return 0.0 if prev_hash == curr_hash else 1.0


def ontology_drift_stub(prev_version: str, curr_version: str) -> dict[str, Any]:
    return {"prev": prev_version, "curr": curr_version, "drift": prev_version != curr_version}


def replay_drift_stub(prev_replay_hash: str, curr_replay_hash: str) -> dict[str, Any]:
    return {"stable": prev_replay_hash == curr_replay_hash, "delta": prev_replay_hash != curr_replay_hash}
