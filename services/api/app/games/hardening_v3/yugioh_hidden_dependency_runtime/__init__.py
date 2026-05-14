"""Yu-Gi-Oh! — dependências ocultas / SEGOC (edge)."""

from __future__ import annotations

from app.games.hardening_v3.yugioh_hidden_dependency_runtime.divergence_diagnostics import (
    runtime_divergence_diagnostic_stub,
)


def yugioh_segoc_edge_stub(*, chain_block: bool, hidden_timing: bool) -> dict[str, bool]:
    return {"risk": chain_block or hidden_timing}


__all__ = ["runtime_divergence_diagnostic_stub", "yugioh_segoc_edge_stub"]
