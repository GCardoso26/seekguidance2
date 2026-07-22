"""Regressão PDV-BUG-003 — Stripe SDK 15: Account sem .get()."""

from __future__ import annotations

from types import SimpleNamespace

from app.marketplace.shop_connect import _stripe_account_as_dict, _stripe_account_flag, _v2_account_ready


def test_stripe_account_flag_uses_attr_not_get():
    account = SimpleNamespace(charges_enabled=True, payouts_enabled=False, details_submitted=True)
    assert _stripe_account_flag(account, "charges_enabled") is True
    assert _stripe_account_flag(account, "payouts_enabled") is False
    assert _stripe_account_flag(account, "details_submitted") is True
    assert _stripe_account_flag(account, "missing") is False


def test_stripe_account_flag_dict():
    assert _stripe_account_flag({"charges_enabled": True}, "charges_enabled") is True
    assert _stripe_account_flag({"charges_enabled": False}, "charges_enabled") is False


def test_stripe_account_as_dict_from_namespace():
    account = SimpleNamespace(
        id="acct_x",
        charges_enabled=True,
        payouts_enabled=True,
        details_submitted=True,
        requirements=None,
    )
    d = _stripe_account_as_dict(account)
    assert d["id"] == "acct_x"
    assert d["charges_enabled"] is True


def test_v2_account_ready_when_no_requirements():
    v2 = SimpleNamespace(requirements=SimpleNamespace(entries=[]), configuration=None)
    # empty entries list is falsy → ready
    assert _v2_account_ready(v2) is True


def test_v2_account_not_ready_with_requirement_entries():
    v2 = SimpleNamespace(
        requirements=SimpleNamespace(entries=[{"requirement": "business_profile.url"}]),
        configuration=None,
    )
    assert _v2_account_ready(v2) is False


def test_shop_connect_source_has_no_account_get():
    from pathlib import Path

    src = Path(__file__).resolve().parents[2] / "app" / "marketplace" / "shop_connect.py"
    text = src.read_text(encoding="utf-8")
    assert "Account.get(" not in text
    assert "stripe.Account.retrieve" in text or "accounts.retrieve" in text
