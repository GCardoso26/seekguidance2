"""Yu-Gi-Oh! — SEGOC (runtime local, soft normalization)."""

from __future__ import annotations

from app.games.hardening_v3.yugioh_hidden_dependency_runtime import yugioh_segoc_edge_stub


def yugioh_segoc_runtime_stub(*, chain_block: bool, hidden_timing: bool) -> dict[str, bool]:
    """Camada explícita «segoc_runtime»; delega ao edge stub existente."""
    return yugioh_segoc_edge_stub(chain_block=chain_block, hidden_timing=hidden_timing)
