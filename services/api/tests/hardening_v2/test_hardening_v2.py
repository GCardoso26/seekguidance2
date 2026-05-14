"""Hardening V2."""

from __future__ import annotations

from app.games.hardening_v2 import (
    digimon_memory_pressure,
    fab_layer_pressure,
    lorcana_lore_pressure,
    mtg_mp_timing_pressure,
    onepiece_don_pressure,
    riftbound_placeholder_pressure,
    yugioh_segoc_chain_flags,
)


def test_ygo() -> None:
    f = yugioh_segoc_chain_flags(segoc=True, hidden_dep=False, simultaneous=True, chain_illegal=False)
    assert f["chain_risk"] is True


def test_fab() -> None:
    assert fab_layer_pressure(layers=6)["pressure"] is True


def test_mtg() -> None:
    assert mtg_mp_timing_pressure(apnap_rounds=8)["pressure"] is True


def test_onepiece() -> None:
    assert onepiece_don_pressure(1, 3)["exhaustion_risk"] is True


def test_digimon() -> None:
    assert digimon_memory_pressure(9, 10)["near_cap"] is True


def test_lorcana() -> None:
    assert lorcana_lore_pressure(5, 5)["song_timing_risk"] is True


def test_riftbound() -> None:
    assert riftbound_placeholder_pressure(2)["needs_adapter"] is True
