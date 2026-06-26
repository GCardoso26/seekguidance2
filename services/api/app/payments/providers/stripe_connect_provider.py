"""Adapter Stripe Connect — implementação de PaymentProvider."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.kyc.merchant_kyc import stripe_account_to_kyc_status
from app.marketplace import shop_connect
from app.payments.providers.base import KycUpdate, OnboardingResult, PaymentProvider


class StripeConnectProvider(PaymentProvider):
    """Stripe Connect Express — onboarding e KYC via account.updated."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_account(self, user_id: str, store_data: dict[str, Any]) -> OnboardingResult:
        payload = await shop_connect.start_connect_onboarding(
            self._session,
            user_id,
            store_id=store_data.get("store_id"),
        )
        return OnboardingResult(
            account_id=str(payload["stripe_account_id"]),
            onboarding_url=str(payload["onboarding_url"]),
            expires_at=payload.get("onboarding_expires_at"),
            metadata={"store_id": payload.get("store_id")},
        )

    async def get_onboarding_url(
        self,
        account_id: str,
        *,
        refresh_url: str,
        return_url: str,
    ) -> OnboardingResult:
        # account_id lookup requires owner_id — use create_account_onboarding_link directly
        raise NotImplementedError("Use shop_connect.create_account_onboarding_link com owner_id")

    def parse_account_updated(self, account: dict[str, Any]) -> KycUpdate:
        kyc_status, reason = stripe_account_to_kyc_status(account)
        requirements = account.get("requirements") or {}
        return KycUpdate(
            account_id=str(account.get("id") or ""),
            kyc_status=kyc_status,
            rejection_reason=reason,
            metadata={
                "charges_enabled": account.get("charges_enabled"),
                "payouts_enabled": account.get("payouts_enabled"),
                "disabled_reason": requirements.get("disabled_reason"),
                "currently_due": requirements.get("currently_due"),
                "pending_verification": requirements.get("pending_verification"),
            },
        )
