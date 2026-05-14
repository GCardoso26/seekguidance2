"""Pressão por adaptador."""

from __future__ import annotations

import pytest
from app.games.adapters.fab.pressure_semantics import combat_chain_pressure
from app.games.adapters.yugioh.pressure_semantics import segoc_maturity_flags

pytestmark = pytest.mark.adversarial


def test_ygo_segoc_flags() -> None:
    f = segoc_maturity_flags("SEGOC simultaneous chain")
    assert f["segoc"] and f["chain_legality"]


def test_fab_combat_pressure() -> None:
    assert combat_chain_pressure(20)["pressure"] > 0.9
