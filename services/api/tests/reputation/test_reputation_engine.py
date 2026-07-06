"""Testes Reputation Engine V2."""

from app.reputation.anti_fraud import compute_fraud_penalty, detect_anti_fraud_flags
from app.reputation.reputation_engine import (
    COLD_START_BASELINE,
    _compute_compliance_score,
    _compute_delivery_score,
    _compute_quality_score,
    _compute_sales_score,
    _resolve_level,
)


def test_cold_start_level() -> None:
    assert _resolve_level(75.0, 2) == "new"


def test_platinum_level() -> None:
    assert _resolve_level(96.0, 20) == "platinum"


def test_sales_score_grows_with_volume() -> None:
    low = _compute_sales_score(5, 0)
    high = _compute_sales_score(100, 0)
    assert high > low


def test_delivery_penalizes_sla() -> None:
    good = _compute_delivery_score(0, 10)
    bad = _compute_delivery_score(5, 10)
    assert good > bad


def test_quality_uses_reviews_partially() -> None:
    assert _compute_quality_score(5.0, 10) == 100.0
    assert _compute_quality_score(0, 0) == COLD_START_BASELINE


def test_compliance_penalizes_chargebacks() -> None:
    clean = _compute_compliance_score(0, 0, 0.0)
    dirty = _compute_compliance_score(2, 1, 0.2)
    assert clean > dirty


def test_anti_fraud_flags_chargeback_spike() -> None:
    flags = detect_anti_fraud_flags({"chargebacks_30d": 3, "chargebacks_open": 1})
    assert "chargeback_spike" in flags
    assert compute_fraud_penalty(flags) > 0
