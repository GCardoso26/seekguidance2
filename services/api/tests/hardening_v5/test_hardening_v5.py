from app.games.hardening_v5 import normalization_leak_diagnostics_v5_stub, yugioh_mobile_edge_hints_stub


def test_hardening_v5_stub() -> None:
    out = normalization_leak_diagnostics_v5_stub(["a"])
    assert out["normalization_leak_diagnostics"]["count"] == 1


def test_mobile_edge_hints_wraps_runtime() -> None:
    out = yugioh_mobile_edge_hints_stub()
    assert out["mobile_edge"]["no_strong_cross_tcg_equivalence"] is True


def test_mobile_edge_hints_v2_envelope() -> None:
    from app.games.hardening_v5 import yugioh_mobile_edge_hints_v2_stub

    out = yugioh_mobile_edge_hints_v2_stub()
    assert out["mobile_edge"]["v2"]["replay_compact_v2"] is True


def test_cross_tcg_v6_equivalence_safety() -> None:
    from app.games.hardening_v5 import cross_tcg_equivalence_safety_stub

    out = cross_tcg_equivalence_safety_stub()
    assert out["replay_summary"]["strong_equivalence"] is False
