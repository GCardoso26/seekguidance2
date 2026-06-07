"""Testes de integração — rotas Stripe (/runtime/judge/stripe/*)."""

from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import stripe
from app.core.config import Settings, get_settings
from app.infrastructure.db.session import get_db_session
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

USER_ID = "user_test_stripe_123"
HEADERS = {"X-Judge-User-Id": USER_ID}


def _stripe_settings() -> Settings:
    return Settings(
        database_url=os.environ["DATABASE_URL"],
        redis_url=os.environ["REDIS_URL"],
        stripe_secret_key="sk_test_integration",
        stripe_webhook_secret="whsec_test_integration",
        stripe_price_monthly_spike="price_monthly_spike_test",
        stripe_price_annual_spike="price_annual_spike_test",
        stripe_price_monthly_team="price_monthly_team_test",
        stripe_price_annual_team="price_annual_team_test",
        stripe_trial_days=14,
    )


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
    app.dependency_overrides.clear()


@pytest.fixture
def mock_db():
    db = AsyncMock()
    result = MagicMock()
    result.mappings.return_value.first.return_value = None
    db.execute = AsyncMock(return_value=result)
    db.commit = AsyncMock()
    return db


@pytest.fixture
def stripe_app(mock_db):
    async def _db():
        yield mock_db

    app.dependency_overrides[get_db_session] = _db
    app.dependency_overrides[get_settings] = _stripe_settings
    return app


@pytest.fixture
def mock_checkout_session():
    return {
        "id": "cs_test_123",
        "customer": "cus_test_123",
        "subscription": "sub_test_123",
        "metadata": {"user_id": USER_ID, "tier": "spike"},
        "url": "https://checkout.stripe.com/test",
    }


@pytest.fixture
def mock_stripe_subscription():
    now = datetime.now(UTC)
    return {
        "id": "sub_test_123",
        "status": "active",
        "customer": "cus_test_123",
        "current_period_start": int(now.timestamp()),
        "current_period_end": int((now + timedelta(days=30)).timestamp()),
        "items": {"data": [{"price": {"id": "price_monthly_spike_test"}}]},
        "cancel_at_period_end": False,
        "metadata": {"user_id": USER_ID},
    }


@pytest.fixture
def mock_invoice():
    now = datetime.now(UTC)
    return {
        "id": "in_test_123",
        "subscription": "sub_test_123",
        "customer": "cus_test_123",
        "amount_due": 1500,
        "amount_paid": 1500,
        "currency": "usd",
        "status": "paid",
        "invoice_pdf": "https://stripe.com/invoice.pdf",
        "hosted_invoice_url": "https://stripe.com/invoice",
        "period_start": int(now.timestamp()),
        "period_end": int((now + timedelta(days=30)).timestamp()),
        "metadata": {"user_id": USER_ID},
    }


class TestCheckout:
    @patch("app.api.v1.stripe_billing.record_analytics_events", new_callable=AsyncMock)
    @patch("stripe.checkout.Session.create")
    @patch("app.api.v1.stripe_billing.get_or_create_customer", new_callable=AsyncMock)
    def test_create_checkout_session_success(
        self,
        mock_get_customer,
        mock_session_create,
        mock_analytics,
        stripe_app,
        mock_checkout_session,
    ):
        mock_get_customer.return_value = "cus_test_123"
        mock_session_create.return_value = MagicMock(
            id=mock_checkout_session["id"],
            url=mock_checkout_session["url"],
        )
        mock_analytics.return_value = 1

        r = client.post(
            "/runtime/judge/stripe/checkout",
            headers=HEADERS,
            json={
                "price_id": "monthly_spike",
                "tier": "spike",
                "success_url": "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
                "cancel_url": "http://localhost:3000/pricing",
            },
        )

        assert r.status_code == 200
        data = r.json()
        assert data["session_id"] == "cs_test_123"
        assert data["url"] == "https://checkout.stripe.com/test"

        kwargs = mock_session_create.call_args.kwargs
        assert kwargs["mode"] == "subscription"
        assert kwargs["subscription_data"]["trial_period_days"] == 14
        assert kwargs["allow_promotion_codes"] is True

    @patch("app.api.v1.stripe_billing.record_analytics_events", new_callable=AsyncMock)
    @patch("stripe.checkout.Session.create")
    @patch("app.api.v1.stripe_billing.get_or_create_customer", new_callable=AsyncMock)
    def test_create_checkout_stripe_error(
        self,
        mock_get_customer,
        mock_session_create,
        mock_analytics,
        stripe_app,
    ):
        mock_get_customer.return_value = "cus_test_123"
        mock_session_create.side_effect = stripe.error.StripeError("Cartão recusado")
        mock_analytics.return_value = 0

        r = client.post(
            "/runtime/judge/stripe/checkout",
            headers=HEADERS,
            json={
                "price_id": "monthly_spike",
                "tier": "spike",
                "success_url": "http://localhost:3000/payment/success",
                "cancel_url": "http://localhost:3000/pricing",
            },
        )

        assert r.status_code == 400
        assert "Cartão recusado" in r.json()["detail"]

    def test_create_checkout_unauthorized(self, stripe_app):
        r = client.post(
            "/runtime/judge/stripe/checkout",
            json={"price_id": "monthly_spike", "tier": "spike"},
        )
        assert r.status_code == 401


class TestWebhook:
    @patch("app.api.v1.stripe_billing.record_analytics_events", new_callable=AsyncMock)
    @patch("app.api.v1.stripe_billing.upsert_subscription", new_callable=AsyncMock)
    @patch("stripe.Subscription.retrieve")
    @patch("stripe.Webhook.construct_event")
    def test_webhook_checkout_completed(
        self,
        mock_construct,
        mock_sub_retrieve,
        mock_upsert,
        mock_analytics,
        stripe_app,
        mock_checkout_session,
        mock_stripe_subscription,
    ):
        mock_construct.return_value = {
            "type": "checkout.session.completed",
            "id": "evt_1",
            "data": {"object": mock_checkout_session},
        }
        mock_sub_retrieve.return_value = mock_stripe_subscription
        mock_analytics.return_value = 1

        r = client.post(
            "/runtime/judge/stripe/webhook",
            data=b"{}",
            headers={"Stripe-Signature": "sig_test"},
        )

        assert r.status_code == 200
        assert r.json()["status"] == "success"
        mock_upsert.assert_awaited_once()

    @patch("app.api.v1.stripe_billing.insert_invoice", new_callable=AsyncMock)
    @patch("app.api.v1.stripe_billing.record_analytics_events", new_callable=AsyncMock)
    @patch("stripe.Webhook.construct_event")
    def test_webhook_invoice_paid(
        self,
        mock_construct,
        mock_analytics,
        mock_insert,
        stripe_app,
        mock_invoice,
    ):
        mock_construct.return_value = {
            "type": "invoice.paid",
            "id": "evt_2",
            "data": {"object": mock_invoice},
        }
        mock_analytics.return_value = 1

        r = client.post(
            "/runtime/judge/stripe/webhook",
            data=b"{}",
            headers={"Stripe-Signature": "sig_test"},
        )
        assert r.status_code == 200
        mock_insert.assert_awaited_once()

    @patch("app.api.v1.stripe_billing.update_subscription_status", new_callable=AsyncMock)
    @patch("app.api.v1.stripe_billing.record_analytics_events", new_callable=AsyncMock)
    @patch("stripe.Webhook.construct_event")
    def test_webhook_payment_failed(
        self,
        mock_construct,
        mock_analytics,
        mock_update_status,
        stripe_app,
        mock_invoice,
    ):
        failed = {**mock_invoice, "status": "open"}
        mock_construct.return_value = {
            "type": "invoice.payment_failed",
            "id": "evt_3",
            "data": {"object": failed},
        }
        mock_analytics.return_value = 1

        r = client.post(
            "/runtime/judge/stripe/webhook",
            data=b"{}",
            headers={"Stripe-Signature": "sig_test"},
        )
        assert r.status_code == 200
        mock_update_status.assert_awaited_once()
        assert mock_update_status.call_args[0][1] == "sub_test_123"
        assert mock_update_status.call_args[0][2] == "past_due"

    @patch("stripe.Webhook.construct_event")
    def test_webhook_missing_signature(self, mock_construct, stripe_app):
        r = client.post("/runtime/judge/stripe/webhook", data=b"{}")
        assert r.status_code == 400

    @patch("app.api.v1.stripe_billing.sync_subscription_from_stripe", new_callable=AsyncMock)
    @patch("stripe.Webhook.construct_event")
    def test_webhook_subscription_updated(
        self,
        mock_construct,
        mock_sync,
        stripe_app,
        mock_stripe_subscription,
    ):
        updated = {**mock_stripe_subscription, "cancel_at_period_end": True}
        mock_construct.return_value = {
            "type": "customer.subscription.updated",
            "id": "evt_4",
            "data": {"object": updated},
        }
        r = client.post(
            "/runtime/judge/stripe/webhook",
            data=b"{}",
            headers={"Stripe-Signature": "sig_test"},
        )
        assert r.status_code == 200
        mock_sync.assert_awaited_once()

    @patch("app.api.v1.stripe_billing.cancel_subscription_row", new_callable=AsyncMock)
    @patch("app.api.v1.stripe_billing.record_analytics_events", new_callable=AsyncMock)
    @patch("stripe.Webhook.construct_event")
    def test_webhook_subscription_deleted(
        self,
        mock_construct,
        mock_analytics,
        mock_cancel,
        stripe_app,
        mock_stripe_subscription,
    ):
        mock_construct.return_value = {
            "type": "customer.subscription.deleted",
            "id": "evt_5",
            "data": {"object": mock_stripe_subscription},
        }
        mock_analytics.return_value = 1
        r = client.post(
            "/runtime/judge/stripe/webhook",
            data=b"{}",
            headers={"Stripe-Signature": "sig_test"},
        )
        assert r.status_code == 200
        mock_cancel.assert_awaited_once()

    @patch("stripe.Webhook.construct_event")
    def test_webhook_invalid_signature(self, mock_construct, stripe_app):
        mock_construct.side_effect = stripe.SignatureVerificationError("bad sig", sig_header="x")
        r = client.post(
            "/runtime/judge/stripe/webhook",
            data=b"{}",
            headers={"Stripe-Signature": "invalid"},
        )
        assert r.status_code == 400


class TestCustomerPortal:
    @patch("app.api.v1.stripe_billing.record_analytics_events", new_callable=AsyncMock)
    @patch("stripe.billing_portal.Session.create")
    @patch("app.api.v1.stripe_billing.get_subscription_row", new_callable=AsyncMock)
    def test_create_portal_session(
        self,
        mock_get_row,
        mock_portal_create,
        mock_analytics,
        stripe_app,
    ):
        mock_get_row.return_value = {
            "stripe_customer_id": "cus_test_123",
            "tier": "spike",
            "status": "active",
        }
        mock_portal_create.return_value = MagicMock(url="https://billing.stripe.com/test")
        mock_analytics.return_value = 1

        r = client.post(
            "/runtime/judge/stripe/portal",
            headers=HEADERS,
            json={"return_url": "http://localhost:3000/settings/billing"},
        )

        assert r.status_code == 200
        assert r.json()["url"] == "https://billing.stripe.com/test"

    @patch("app.api.v1.stripe_billing.get_subscription_row", new_callable=AsyncMock)
    def test_portal_no_customer(self, mock_get_row, stripe_app):
        mock_get_row.return_value = None
        r = client.post(
            "/runtime/judge/stripe/portal",
            headers=HEADERS,
            json={"return_url": "http://localhost:3000/settings/billing"},
        )
        assert r.status_code == 404


class TestSubscriptionStatus:
    @patch("app.api.v1.stripe_billing.get_subscription_row", new_callable=AsyncMock)
    def test_get_subscription_free_user(self, mock_get_row, stripe_app):
        mock_get_row.return_value = None
        r = client.get("/runtime/judge/stripe/subscription", headers=HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert data["tier"] == "free"
        assert data["features"]["advanced_analytics"] is False

    @patch("app.api.v1.stripe_billing.get_subscription_row", new_callable=AsyncMock)
    def test_get_subscription_pro_user(self, mock_get_row, stripe_app):
        mock_get_row.return_value = {
            "tier": "spike",
            "status": "active",
            "current_period_end": datetime.now(UTC),
            "cancel_at_period_end": False,
        }
        r = client.get("/runtime/judge/stripe/subscription", headers=HEADERS)
        data = r.json()
        assert data["tier"] == "pro"
        assert data["tier_raw"] == "spike"
        assert data["features"]["advanced_analytics"] is True
        assert data["features"]["team_management"] is False

    @patch("app.api.v1.stripe_billing.get_subscription_row", new_callable=AsyncMock)
    def test_get_subscription_team_user(self, mock_get_row, stripe_app):
        mock_get_row.return_value = {
            "tier": "team",
            "status": "trialing",
            "current_period_end": datetime.now(UTC),
            "cancel_at_period_end": False,
        }
        r = client.get("/runtime/judge/stripe/subscription", headers=HEADERS)
        data = r.json()
        assert data["tier"] == "team"
        assert data["features"]["api_access"] is True
