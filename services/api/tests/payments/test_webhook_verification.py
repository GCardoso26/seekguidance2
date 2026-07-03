"""Testes de verificação de assinatura Stripe webhook."""

import pytest
from app.payments.webhooks import verify_stripe_webhook
from fastapi import HTTPException

import stripe


def test_verify_stripe_webhook_missing_signature():
    with pytest.raises(HTTPException) as exc:
        verify_stripe_webhook(b"{}", None, "whsec_test")
    assert exc.value.status_code == 400
    assert "Missing" in str(exc.value.detail)


def test_verify_stripe_webhook_missing_secret():
    with pytest.raises(HTTPException) as exc:
        verify_stripe_webhook(b"{}", "sig", "")
    assert exc.value.status_code == 503


def test_verify_stripe_webhook_invalid_payload(monkeypatch):
    def _raise(*_a, **_k):
        raise ValueError("bad payload")

    monkeypatch.setattr(stripe.Webhook, "construct_event", _raise)
    with pytest.raises(HTTPException) as exc:
        verify_stripe_webhook(b"not-json", "sig", "whsec_test")
    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid payload"


def test_verify_stripe_webhook_invalid_signature(monkeypatch):
    def _raise(*_a, **_k):
        raise stripe.SignatureVerificationError("bad", sig_header="x")

    monkeypatch.setattr(stripe.Webhook, "construct_event", _raise)
    with pytest.raises(HTTPException) as exc:
        verify_stripe_webhook(b"{}", "bad_sig", "whsec_test")
    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid signature"


def test_verify_stripe_webhook_success(monkeypatch):
    monkeypatch.setattr(
        stripe.Webhook,
        "construct_event",
        lambda payload, sig, secret: {"id": "evt_1", "type": "account.updated"},
    )
    event = verify_stripe_webhook(b"{}", "sig_ok", "whsec_test")
    assert event["type"] == "account.updated"
