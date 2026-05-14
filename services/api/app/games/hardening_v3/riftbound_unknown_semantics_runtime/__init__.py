"""Riftbound — semântica desconhecida (runtime)."""

from __future__ import annotations

from typing import Any

from app.games.hardening_v3.riftbound_unknown_runtime import riftbound_semantic_injection_stub


def riftbound_unknown_semantics_runtime_stub(tags: list[str]) -> dict[str, Any]:
    base = riftbound_semantic_injection_stub(tags)
    base["unknown_semantics_lane"] = True
    return base
