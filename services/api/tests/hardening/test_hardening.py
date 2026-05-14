"""Games hardening."""

from __future__ import annotations

from app.games.hardening import (
    fab_chain_pressure,
    hidden_dependency_pressure,
    mtg_mp_pressure,
    normalization_leak_flags,
    timing_window_pressure,
    yugioh_chain_pressure,
)


def test_ygo() -> None:
    assert yugioh_chain_pressure(chain_length=8, segoc_tokens=1)["high_pressure"] is True


def test_fab() -> None:
    assert fab_chain_pressure(reaction_windows=6)["pressure"] is True


def test_mtg_mp() -> None:
    assert mtg_mp_pressure(players=4, simultaneous=True)["pressure"] is True


def test_timing() -> None:
    assert timing_window_pressure(4)["pressure"] is True


def test_hidden() -> None:
    assert hidden_dependency_pressure(5)["pressure"] is True


def test_leak() -> None:
    assert normalization_leak_flags(universal_rule_applied_to_local=False, hard_equivalence=True)[
        "leak_risk"
    ] is True
