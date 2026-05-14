"""Cross-TCG hardening v6 (pacote app hardening_v4)."""

from __future__ import annotations

from app.games.hardening_v4 import (
    cross_tcg_diagnostics_bundle_stub,
    yugioh_competitive_chain_runtime_stub,
)


def test_ygo_competitive() -> None:
    assert yugioh_competitive_chain_runtime_stub(segoc_ok=True, chain_divergence=0.1)["segoc_ok"] is True


def test_cross_tcg_diagnostics() -> None:
    d = cross_tcg_diagnostics_bundle_stub()
    assert "normalization_leak" in d
