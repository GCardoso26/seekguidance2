"""Replay de dataset móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_dataset_replay_stub(case_ref: str) -> dict[str, Any]:
    return {
        "case_ref": case_ref,
        "assistant_notes": ["Replay local para regressão judge-grade compacta."],
        "replay_summary": {"events": 24},
        "deterministic_alignment": {"token": f"mdr-{case_ref}"},
    }
