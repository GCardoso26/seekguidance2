"""Caps globais de runtime móvel v6 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_caps_v2_stub(mem_mb: int) -> dict[str, Any]:
    cap = 8 if mem_mb < 3072 else 16
    return {
        "mem_mb": mem_mb,
        "branch_cap": cap,
        "assistant_notes": ["Caps adaptativos; lineage preservado nos heads mantidos."],
        "replay_summary": {"caps": "v6"},
        "deterministic_alignment": {"token": "mrcap-v6"},
    }
