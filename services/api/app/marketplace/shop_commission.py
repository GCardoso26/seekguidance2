"""Cálculo de comissão da plataforma (marketplace shop)."""

from __future__ import annotations

DEFAULT_COMMISSION_RATE = 0.15


def normalize_commission_rate(rate: float | None) -> float:
    if rate is None:
        return DEFAULT_COMMISSION_RATE
    value = float(rate)
    if value < 0 or value >= 1:
        return DEFAULT_COMMISSION_RATE
    return value


def platform_fee_cents(gross_cents: int, commission_rate: float | None = None) -> int:
    rate = normalize_commission_rate(commission_rate)
    return int(round(max(0, gross_cents) * rate))


def store_receives_cents(gross_cents: int, commission_rate: float | None = None) -> int:
    gross = max(0, gross_cents)
    return gross - platform_fee_cents(gross, commission_rate)
