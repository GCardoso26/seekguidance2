"""PIX gateway webhook verification — fail-closed."""

from __future__ import annotations

from app.core.config import Settings
from app.marketplace.pix_gateway import AsaasGateway, ManualPixGateway, OpenPixGateway, get_pix_gateway


def test_manual_rejects_without_secret():
    gw = ManualPixGateway(None)
    assert gw.verify_webhook(b"{}", {}) is False


def test_manual_accepts_matching_secret():
    gw = ManualPixGateway("s3cret-internal")
    assert gw.verify_webhook(b"{}", {"x-pix-webhook-secret": "s3cret-internal"}) is True
    assert gw.verify_webhook(b"{}", {"x-pix-webhook-secret": "wrong"}) is False


def test_asaas_rejects_without_token_configured():
    gw = AsaasGateway("api-key", webhook_token=None)
    assert gw.verify_webhook(b"{}", {"asaas-access-token": "anything"}) is False


def test_asaas_requires_matching_token():
    gw = AsaasGateway("api-key", webhook_token="tok")
    assert gw.verify_webhook(b"{}", {"asaas-access-token": "tok"}) is True
    assert gw.verify_webhook(b"{}", {}) is False


def test_openpix_rejects_without_secret():
    gw = OpenPixGateway("key", webhook_secret=None)
    assert gw.verify_webhook(b"{}", {}) is False


def test_get_pix_gateway_manual_uses_internal_secret():
    settings = Settings(pix_webhook_internal_secret="internal-x")
    gw = get_pix_gateway(settings)
    assert isinstance(gw, ManualPixGateway)
    assert gw.verify_webhook(b"{}", {"X-Pix-Webhook-Secret": "internal-x"}) is True
