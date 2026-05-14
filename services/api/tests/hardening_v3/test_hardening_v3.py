"""Hardening V3."""

from __future__ import annotations

from app.games.hardening_v3 import (
    digimon_inherited_timing_stub,
    fab_reaction_recursion_stub,
    lorcana_exert_sequencing_stub,
    mtg_apnap_loop_stub,
    onepiece_don_sequencing_stub,
    riftbound_semantic_injection_stub,
    yugioh_segoc_edge_stub,
)


def test_ygo_v3() -> None:
    assert yugioh_segoc_edge_stub(chain_block=True, hidden_timing=False)["risk"] is True


def test_fab_v3() -> None:
    assert fab_reaction_recursion_stub(8)["recursion_pressure"] is True


def test_mtg_v3() -> None:
    assert mtg_apnap_loop_stub(10)["loop_pressure"] is True


def test_digimon_v3() -> None:
    assert digimon_inherited_timing_stub(True)["inherited_overlap"] is True


def test_op_v3() -> None:
    assert onepiece_don_sequencing_stub(False)["order_ok"] is False


def test_lorcana_v3() -> None:
    assert lorcana_exert_sequencing_stub(True)["exert_chain_ok"] is True


def test_riftbound_v3() -> None:
    assert riftbound_semantic_injection_stub(["u"])["injectable"] is True
