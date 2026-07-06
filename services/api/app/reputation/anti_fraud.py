"""Anti-fraud signals para Reputation Engine V2."""

from __future__ import annotations

from typing import Any

# Limiares configuráveis (não hardcoded no score — referência para flags)
CHARGEBACK_SPIKE_THRESHOLD = 2
REFUND_RATE_THRESHOLD = 0.15
SLA_VIOLATION_SPIKE = 5


def detect_anti_fraud_flags(signals: dict[str, Any]) -> list[str]:
    flags: list[str] = []
    chargebacks = int(signals.get("chargebacks_open") or 0)
    chargebacks_30d = int(signals.get("chargebacks_30d") or 0)
    refund_rate = float(signals.get("refund_rate") or 0)
    sla_violations = int(signals.get("sla_violations") or 0)
    disputes_open = int(signals.get("disputes_open") or 0)

    if chargebacks_30d >= CHARGEBACK_SPIKE_THRESHOLD:
        flags.append("chargeback_spike")
    if chargebacks > 0 and chargebacks_30d == chargebacks:
        flags.append("active_chargeback")
    if refund_rate >= REFUND_RATE_THRESHOLD:
        flags.append("high_refund_rate")
    if sla_violations >= SLA_VIOLATION_SPIKE:
        flags.append("sla_violation_spike")
    if disputes_open >= 2:
        flags.append("multiple_disputes")

    return flags


def compute_fraud_penalty(flags: list[str]) -> float:
    """Penalidade agregada — fraudes pesam mais (BR-007)."""
    penalty_map = {
        "chargeback_spike": 15.0,
        "active_chargeback": 8.0,
        "high_refund_rate": 10.0,
        "sla_violation_spike": 6.0,
        "multiple_disputes": 5.0,
    }
    return min(40.0, sum(penalty_map.get(f, 0) for f in flags))
