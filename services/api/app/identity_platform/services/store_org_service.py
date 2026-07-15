"""Store org + payment policies."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.identity_platform.adapters.rc1_store import get_store_row
from app.identity_platform.domain import DEFAULT_PAYMENT_POLICIES
from app.identity_platform.domain.enums import InventoryType, PaymentMethod


class StoreOrgService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_org_view(self, store_id: str) -> dict[str, Any]:
        store = await get_store_row(self._session, store_id)
        if not store:
            raise HTTPException(404, "Loja não encontrada")
        company = None
        if store.get("company_id"):
            company = (
                await self._session.execute(
                    text("SELECT * FROM tcg_judge.companies WHERE id = :cid"),
                    {"cid": store["company_id"]},
                )
            ).mappings().first()
        policies = await StorePolicyService(self._session).list_for_store(store_id)
        return {
            "store": store,
            "company": dict(company) if company else None,
            "payment_policies": policies,
            "inventory_types": [t.value for t in InventoryType],
        }

    async def link_company(self, actor_id: str, store_id: str, company_id: str) -> dict[str, Any]:
        store = await get_store_row(self._session, store_id)
        if not store:
            raise HTTPException(404, "Loja não encontrada")
        if str(store["owner_id"]) != actor_id:
            raise HTTPException(403, "Apenas o owner pode vincular company")
        await self._session.execute(
            text(
                """
                UPDATE tcg_judge.stores
                SET company_id = CAST(:cid AS uuid)
                WHERE id = CAST(:sid AS uuid)
                """
            ),
            {"cid": company_id, "sid": store_id},
        )
        await self._session.commit()
        return await self.get_org_view(store_id)


class StorePolicyService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_store(self, store_id: str) -> list[dict[str, Any]]:
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT inventory_type, methods
                    FROM tcg_judge.store_payment_policies
                    WHERE store_id = CAST(:sid AS uuid)
                    """
                ),
                {"sid": store_id},
            )
        ).mappings().all()
        if rows:
            return [
                {
                    "inventory_type": r["inventory_type"],
                    "methods": list(r["methods"] or []),
                }
                for r in rows
            ]
        return [
            {
                "inventory_type": inv.value,
                "methods": sorted(m.value for m in methods),
                "source": "default",
            }
            for inv, methods in DEFAULT_PAYMENT_POLICIES.items()
        ]

    async def ensure_defaults(self, store_id: str) -> list[dict[str, Any]]:
        for inv, methods in DEFAULT_PAYMENT_POLICIES.items():
            await self._session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.store_payment_policies (store_id, inventory_type, methods)
                    VALUES (CAST(:sid AS uuid), :inv, :methods)
                    ON CONFLICT (store_id, inventory_type) DO NOTHING
                    """
                ),
                {
                    "sid": store_id,
                    "inv": inv.value,
                    "methods": [m.value for m in methods],
                },
            )
        await self._session.commit()
        return await self.list_for_store(store_id)

    def allows(self, inventory_type: InventoryType, method: PaymentMethod, policies: list[dict[str, Any]]) -> bool:
        for row in policies:
            if row.get("inventory_type") == inventory_type.value:
                return method.value in set(row.get("methods") or [])
        defaults = DEFAULT_PAYMENT_POLICIES.get(inventory_type, frozenset())
        return method in defaults
