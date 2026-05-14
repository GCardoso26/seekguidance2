"""Diagnósticos de inconsistência temporal."""

from __future__ import annotations

from typing import Any


def temporal_inconsistency_diagnostics_v5_stub(ok: bool) -> dict[str, Any]:
    return {
        "temporal_inconsistency_diagnostics": ok,
        "assistant_notes": ["Alinhar relógios lógicos e ordens declaradas no replay."],
    }
