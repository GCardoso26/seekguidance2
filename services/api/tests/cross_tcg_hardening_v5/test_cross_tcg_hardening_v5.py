"""Cross-TCG hardening v5."""

from __future__ import annotations

from app.games.hardening_v3 import (
    digimon_memory_drift_runtime_stub,
    fab_reaction_window_instability_stub,
    lorcana_lore_progression_runtime_stub,
    mtg_apnap_runtime_stub,
    onepiece_don_state_runtime_stub,
    pokemon_delayed_resolution_runtime_stub,
    riftbound_unknown_semantics_runtime_stub,
    runtime_divergence_diagnostic_stub,
)


def test_fab_reaction_window() -> None:
    assert fab_reaction_window_instability_stub(10)["timing_instability"] is True


def test_mtg_apnap_runtime() -> None:
    assert "loop_pressure" in mtg_apnap_runtime_stub(3)


def test_pokemon_delayed_resolution() -> None:
    assert pokemon_delayed_resolution_runtime_stub(6)["delayed_window_risk"] is True


def test_onepiece_don_state() -> None:
    assert onepiece_don_state_runtime_stub(True)["order_ok"] is True


def test_digimon_memory_drift() -> None:
    assert digimon_memory_drift_runtime_stub(0.9)["semantic_incompatibility_warning"] is True


def test_lorcana_progression() -> None:
    assert lorcana_lore_progression_runtime_stub(20)["normalization_leak_risk"] is True


def test_riftbound_unknown_semantics() -> None:
    assert riftbound_unknown_semantics_runtime_stub(["t"])["unknown_semantics_lane"] is True


def test_ygo_divergence() -> None:
    assert runtime_divergence_diagnostic_stub(chain_entropy=0.9)["instability"] is True
