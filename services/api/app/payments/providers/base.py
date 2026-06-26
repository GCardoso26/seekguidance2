"""Interface comum para provedores de pagamento (Stripe Connect, Pagar.me, etc.)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class OnboardingResult:
    account_id: str
    onboarding_url: str
    expires_at: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class KycUpdate:
    account_id: str
    kyc_status: str
    rejection_reason: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


class PaymentProvider(ABC):
    """Contrato para onboarding e webhooks de KYC lojista."""

    @abstractmethod
    async def create_account(self, user_id: str, store_data: dict[str, Any]) -> OnboardingResult:
        """Cria conta conectada no provedor e retorna link de onboarding."""

    @abstractmethod
    async def get_onboarding_url(
        self,
        account_id: str,
        *,
        refresh_url: str,
        return_url: str,
    ) -> OnboardingResult:
        """Gera (ou regenera) URL de onboarding para conta existente."""

    @abstractmethod
    def parse_account_updated(self, account: dict[str, Any]) -> KycUpdate:
        """Interpreta payload de webhook account.updated (ou equivalente)."""
