"""Games stability engine."""

from __future__ import annotations

from app.games.stability import (
    boundary_violation_flags,
    detect_abstraction_leak_risk,
    pressure_matrix_stub,
    runtime_diff_report,
    soft_normalization_safe,
    timing_conflict_hints,
)


def test_pressure_matrix() -> None:
    m = pressure_matrix_stub()
    assert "yugioh" in m


def test_boundary() -> None:
    f = boundary_violation_flags(universal_term="stack", game_specific_terms=[str(i) for i in range(8)])
    assert f["overload"] is True


def test_normalization_safety() -> None:
    assert soft_normalization_safe(False)["safe"] is True


def test_timing_and_diff() -> None:
    assert timing_conflict_hints(["a", "b"])["potential_conflict"] is True
    d = runtime_diff_report({"x": 1}, {"x": 2})
    assert "x" in d["diff_keys"]


def test_leak() -> None:
    assert detect_abstraction_leak_risk(20, threshold=5)["risk"] is True
