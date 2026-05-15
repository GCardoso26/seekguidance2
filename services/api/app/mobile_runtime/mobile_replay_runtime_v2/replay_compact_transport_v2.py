"""Replay compacto e transporte móvel v2 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_compact_transport_v2_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "assistant_notes": [
            "mobile_replay_runtime_v2: payloads compactos; explainability-first.",
        ],
        "replay_summary": {"transport": "delta_bundle_stub"},
        "deterministic_alignment": {"hash_hint": f"mrt-{replay_ref}"},
        "pruning_policy": {"safe_for_mobile": True},
    }
