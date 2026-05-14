"""Cross-TCG hardening v4 (extensões v3)."""

from __future__ import annotations

from app.games.hardening_v3 import (
    fab_combat_runtime_stub,
    onepiece_don_runtime_stub,
    pokemon_delayed_effects_stub,
    riftbound_experimental_runtime_stub,
    yugioh_segoc_runtime_stub,
)


def test_ygo_segoc_runtime() -> None:
    assert yugioh_segoc_runtime_stub(chain_block=False, hidden_timing=False)["risk"] is False


def test_fab_combat_runtime() -> None:
    assert fab_combat_runtime_stub(3)["depth"] == 3


def test_pokemon_delayed() -> None:
    assert pokemon_delayed_effects_stub(10)["delayed_window_risk"] is True


def test_onepiece_don_runtime() -> None:
    assert onepiece_don_runtime_stub(True)["order_ok"] is True


def test_riftbound_experimental() -> None:
    r = riftbound_experimental_runtime_stub(["x"])
    assert r.get("experimental_lane") is True
