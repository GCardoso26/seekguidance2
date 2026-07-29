"""Testes Sprint 7 — pagamentos adiados, valuation, CSV import."""

from __future__ import annotations

import pytest
from app.marketplace.payments_gate import is_payments_live, payments_status, require_live_payments
from fastapi import HTTPException


class FakeSettings:
    payments_enabled = False
    platform_pix_key = None


class FakeSettingsLive:
    payments_enabled = True
    platform_pix_key = "test-key"


def test_payments_deferred_by_default():
    assert payments_status(FakeSettings()) == "deferred"
    assert not is_payments_live(FakeSettings())


def test_payments_live_when_enabled_and_key():
    assert payments_status(FakeSettingsLive()) == "live"
    assert is_payments_live(FakeSettingsLive())


def test_require_live_payments_raises_deferred():
    with pytest.raises(HTTPException) as exc:
        require_live_payments(FakeSettings())
    assert exc.value.status_code == 503
    detail = exc.value.detail
    assert isinstance(detail, dict)
    assert detail.get("code") == "payments_deferred"


def test_go_live_blockers_when_flags_off():
    from app.ops.health_check import collect_go_live_blockers

    blockers = collect_go_live_blockers(
        payments="deferred",
        melhor_envio={"status": "disabled"},
        sentry="disabled",
    )
    codes = {b["code"] for b in blockers}
    assert codes == {"payments_deferred", "melhor_envio_disabled", "sentry_disabled"}
    assert all("fix" in b for b in blockers)


def test_go_live_blockers_empty_when_live():
    from app.ops.health_check import collect_go_live_blockers

    blockers = collect_go_live_blockers(
        payments="live",
        melhor_envio={"status": "configured"},
        sentry="ok",
    )
    assert blockers == []


def test_go_live_blockers_partial_melhor_envio():
    from app.ops.health_check import collect_go_live_blockers

    blockers = collect_go_live_blockers(
        payments="live",
        melhor_envio={"status": "partial"},
        sentry="ok",
    )
    assert [b["code"] for b in blockers] == ["melhor_envio_partial"]


def test_parse_csv_row_valid():
    from app.marketplace.shop_inventory import _parse_csv_row

    parsed, err = _parse_csv_row(
        {"name": "Booster", "category": "booster", "price_cents": "1990", "stock": "12"},
        2,
    )
    assert err is None
    assert parsed is not None
    assert parsed["name"] == "Booster"
    assert parsed["price_cents"] == 1990


def test_parse_csv_row_invalid_category():
    from app.marketplace.shop_inventory import _parse_csv_row

    parsed, err = _parse_csv_row(
        {"name": "X", "category": "invalid", "price_cents": "100", "stock": "1"},
        3,
    )
    assert parsed is None
    assert "categoria" in (err or "")
