"""Diagnósticos de replay (divergência, amplificação, convergência)."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app.runtime.replay.replay_hashing import deterministic_hash


def _digest_events(events: list[dict[str, Any]]) -> str:
    raw = json.dumps(events, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def replay_diagnostics_bundle(events_a: list[dict[str, Any]], events_b: list[dict[str, Any]]) -> dict[str, Any]:
    ha = _digest_events(events_a)
    hb = _digest_events(events_b)
    divergence = ha != hb
    uniq = {deterministic_hash(e) for e in events_a}
    amp = len(events_a) / max(1, len(uniq))
    return {
        "deterministic_mismatch": divergence,
        "branch_amplification_proxy": round(amp, 4),
        "convergence_failure": divergence and amp > 1.2,
        "replay_explosion": len(events_a) > 512,
        "assistant_note": "Se divergir, mostre diferenças em linguagem de mesa, não hashes completos.",
    }
