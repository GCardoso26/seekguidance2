"""Reasoning compacto para dispositivo (sem substituir reasoning_v1…v11 no servidor)."""

from __future__ import annotations

from typing import Any


def lightweight_reasoning_stub(case_id: str) -> dict[str, Any]:
    return {
        "case_id": case_id,
        "depth_cap": 6,
        "assistant_notes": ["Hints locais; juiz humano mantém decisão.", "Contratos V1–V11 inalterados no core."],
    }
