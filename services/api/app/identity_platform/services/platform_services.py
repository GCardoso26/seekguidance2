"""Supporting services: Subscription, Wallet, Trust, KYC, Consent."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.identity_platform.adapters.rc1_store import list_owner_stores
from app.identity_platform.domain.enums import (
    CompanyKycStatus,
    ConsentPurpose,
    SubscriptionPlan,
    SubscriptionStatus,
    SubscriptionSubjectType,
    WalletBalanceType,
)

_LEGACY_PLAN_MAP = {
    "free": SubscriptionPlan.FREE,
    "lojista": SubscriptionPlan.SELLER_STARTER,
    "pro": SubscriptionPlan.SELLER_PRO,
    "enterprise": SubscriptionPlan.ENTERPRISE,
}


class SubscriptionService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_user(self, user_id: str) -> dict[str, Any]:
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT * FROM tcg_judge.platform_subscriptions
                    WHERE (subject_type = 'user' AND subject_id = :uid)
                       OR (subject_type = 'store' AND subject_id IN (
                            SELECT id::text FROM tcg_judge.stores WHERE owner_id = :uid
                       ))
                    ORDER BY created_at DESC
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().all()
        subscriptions = [dict(r) for r in rows]
        legacy = []
        for store in await list_owner_stores(self._session, user_id):
            plan = _LEGACY_PLAN_MAP.get(
                str(store.get("subscription_plan") or "free"), SubscriptionPlan.FREE
            )
            legacy.append(
                {
                    "subject_type": SubscriptionSubjectType.STORE.value,
                    "subject_id": str(store["id"]),
                    "plan": plan.value,
                    "status": SubscriptionStatus.ACTIVE.value,
                    "source": "rc1_stores.subscription_plan",
                }
            )
        return {
            "subscriptions": subscriptions,
            "legacy_projections": legacy,
            "available_plans": [p.value for p in SubscriptionPlan],
        }


class WalletService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_or_create_user_wallet(self, user_id: str) -> dict[str, Any]:
        row = (
            await self._session.execute(
                text(
                    """
                    SELECT * FROM tcg_judge.wallets
                    WHERE owner_type = 'user' AND owner_id = :uid
                    LIMIT 1
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().first()
        if row:
            return await self._wallet_payload(dict(row))
        created = (
            await self._session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.wallets (owner_type, owner_id, currency)
                    VALUES ('user', :uid, 'BRL')
                    RETURNING *
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().first()
        await self._session.commit()
        return await self._wallet_payload(dict(created) if created else {"id": None})

    async def _wallet_payload(self, wallet: dict[str, Any]) -> dict[str, Any]:
        if not wallet.get("id"):
            return {"wallet": None, "balances": {}, "note": "Wallet ready; checkout unchanged"}
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT balance_type, COALESCE(SUM(amount_cents), 0) AS cents
                    FROM tcg_judge.wallet_ledgers
                    WHERE wallet_id = :wid
                    GROUP BY balance_type
                    """
                ),
                {"wid": wallet["id"]},
            )
        ).mappings().all()
        balances = {t.value: 0 for t in WalletBalanceType}
        for r in rows:
            balances[str(r["balance_type"])] = int(r["cents"])
        return {
            "wallet": {"id": str(wallet["id"]), "currency": wallet.get("currency") or "BRL"},
            "balances": balances,
            "note": "Architecture prepared; not wired to checkout",
        }


class TrustService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def store_trust(self, store_id: str) -> dict[str, Any]:
        snap = (
            await self._session.execute(
                text(
                    """
                    SELECT * FROM tcg_judge.store_trust_snapshots
                    WHERE store_id = CAST(:sid AS uuid)
                    ORDER BY computed_at DESC
                    LIMIT 1
                    """
                ),
                {"sid": store_id},
            )
        ).mappings().first()
        if snap:
            return dict(snap)

        score = 50
        factors: dict[str, Any] = {"source": "default_baseline"}
        try:
            rep = (
                await self._session.execute(
                    text(
                        """
                        SELECT trust_score FROM tcg_judge.reputations
                        WHERE subject_type = 'store' AND subject_id = :sid
                        LIMIT 1
                        """
                    ),
                    {"sid": store_id},
                )
            ).mappings().first()
            if rep and rep.get("trust_score") is not None:
                raw = float(rep["trust_score"])
                score = int(raw if raw > 10 else raw * 20)
                factors = {"source": "reputations.trust_score", "raw": raw}
        except Exception:
            pass
        return {
            "store_id": store_id,
            "score": max(0, min(100, score)),
            "factors": factors,
            "persisted": False,
        }

    async def buyer_trust(self, user_id: str) -> dict[str, Any]:
        snap = (
            await self._session.execute(
                text(
                    """
                    SELECT * FROM tcg_judge.buyer_trust_snapshots
                    WHERE user_id = :uid
                    ORDER BY computed_at DESC
                    LIMIT 1
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().first()
        if snap:
            return {**dict(snap), "display": False}
        return {
            "user_id": user_id,
            "score": 50,
            "factors": {"source": "default_baseline"},
            "display": False,
            "note": "Buyer trust computed for internal use only",
        }


class KycService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_case(self, company_id: str) -> dict[str, Any]:
        row = (
            await self._session.execute(
                text(
                    """
                    SELECT * FROM tcg_judge.company_kyc_cases
                    WHERE company_id = CAST(:cid AS uuid)
                    ORDER BY created_at DESC
                    LIMIT 1
                    """
                ),
                {"cid": company_id},
            )
        ).mappings().first()
        docs = (
            await self._session.execute(
                text(
                    """
                    SELECT id, doc_type, status, created_at
                    FROM tcg_judge.company_kyc_documents
                    WHERE company_id = CAST(:cid AS uuid)
                    ORDER BY created_at DESC
                    """
                ),
                {"cid": company_id},
            )
        ).mappings().all()
        return {
            "case": dict(row) if row else None,
            "documents": [dict(d) for d in docs],
            "pipeline": [
                "company",
                "documents",
                "receita_federal_stub",
                "bank_account_stub",
                "representative",
                "status",
            ],
            "integrations": {"receita_federal": False, "open_banking": False},
        }

    async def submit_case(self, user_id: str, company_id: str) -> dict[str, Any]:
        row = (
            await self._session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.company_kyc_cases (
                      company_id, status, submitted_by, submitted_at
                    ) VALUES (
                      CAST(:cid AS uuid), :st, :uid, NOW()
                    )
                    RETURNING *
                    """
                ),
                {"cid": company_id, "st": CompanyKycStatus.SUBMITTED.value, "uid": user_id},
            )
        ).mappings().first()
        await self._session.execute(
            text(
                """
                UPDATE tcg_judge.companies
                SET kyc_status = :st, updated_at = NOW()
                WHERE id = CAST(:cid AS uuid)
                """
            ),
            {"st": CompanyKycStatus.SUBMITTED.value, "cid": company_id},
        )
        await self._session.commit()
        return dict(row) if row else {}


class ConsentService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_user(self, user_id: str) -> list[dict[str, Any]]:
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT purpose, granted, version, granted_at, revoked_at
                    FROM tcg_judge.lgpd_consents
                    WHERE user_id = :uid
                    ORDER BY purpose
                    """
                ),
                {"uid": user_id},
            )
        ).mappings().all()
        by_purpose = {str(r["purpose"]): dict(r) for r in rows}
        out = []
        for purpose in ConsentPurpose:
            if purpose.value in by_purpose:
                out.append(by_purpose[purpose.value])
            else:
                out.append(
                    {
                        "purpose": purpose.value,
                        "granted": False,
                        "version": "1",
                        "granted_at": None,
                    }
                )
        return out

    async def set_consent(
        self,
        user_id: str,
        purpose: ConsentPurpose,
        granted: bool,
        version: str = "1",
    ) -> dict[str, Any]:
        row = (
            await self._session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.lgpd_consents (
                      user_id, purpose, granted, version, granted_at, revoked_at
                    ) VALUES (
                      :uid, :purpose, :granted, :ver,
                      CASE WHEN :granted THEN NOW() ELSE NULL END,
                      CASE WHEN NOT :granted THEN NOW() ELSE NULL END
                    )
                    ON CONFLICT (user_id, purpose) DO UPDATE SET
                      granted = EXCLUDED.granted,
                      version = EXCLUDED.version,
                      granted_at = CASE WHEN EXCLUDED.granted THEN NOW()
                                        ELSE lgpd_consents.granted_at END,
                      revoked_at = CASE WHEN NOT EXCLUDED.granted THEN NOW() ELSE NULL END,
                      updated_at = NOW()
                    RETURNING *
                    """
                ),
                {
                    "uid": user_id,
                    "purpose": purpose.value,
                    "granted": granted,
                    "ver": version,
                },
            )
        ).mappings().first()
        await self._session.commit()
        return dict(row) if row else {}
