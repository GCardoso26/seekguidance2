"""Idempotent demo seeder for sandbox/development."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.sandbox.mode import can_run_seed_demo

logger = logging.getLogger("sandbox.seeder")

DEMO_USER_ID = "demo-sandbox-admin"
DEMO_STORE_NAME = "Judge Demo Store"
DEMO_EVENT_NAME = "Judge Demo Event"


class SeedBlockedError(RuntimeError):
    pass


async def seed_demo(session: AsyncSession, *, owner_user_id: str | None = None) -> dict[str, Any]:
    if not can_run_seed_demo():
        raise SeedBlockedError("seed_demo blocked: APP_MODE forbids seeding")

    uid = owner_user_id or DEMO_USER_ID
    report: dict[str, Any] = {"owner_user_id": uid, "steps": {}}

    report["steps"]["identity"] = await _seed_identity(session, uid)
    report["steps"]["financial"] = await _seed_financial(session, uid)
    report["steps"]["tournament"] = await _seed_tournament(session, uid, report["steps"]["identity"])
    report["steps"]["analytics"] = await _seed_analytics_stub()
    report["steps"]["inventory"] = {"status": "skipped", "note": "use seed_inventory_smoke_fixtures for SKUs"}
    report["steps"]["top_movers"] = {"status": "stub", "note": "analytics cold-start SEED_MOVERS"}
    await session.commit()
    return report


async def _seed_identity(session: AsyncSession, user_id: str) -> dict[str, Any]:
    out: dict[str, Any] = {}
    try:
        # Company
        company_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"judge-demo-company-{user_id}"))
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.companies (id, cnpj, legal_name, trade_name, status, created_by)
                VALUES (CAST(:id AS uuid), NULL, 'Judge Demo Company', 'Judge Demo', 'pending_cnpj', :uid)
                ON CONFLICT (id) DO NOTHING
                """
            ),
            {"id": company_id, "uid": user_id},
        )
        out["company_id"] = company_id

        # Find or create store by name+owner
        row = (
            await session.execute(
                text(
                    """
                    SELECT id::text FROM tcg_judge.stores
                    WHERE owner_id = :uid AND name = :name LIMIT 1
                    """
                ),
                {"uid": user_id, "name": DEMO_STORE_NAME},
            )
        ).mappings().first()
        if row:
            store_id = row["id"]
        else:
            store_id = str(uuid.uuid4())
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.stores (id, name, owner_id, subscription_plan, shop_enabled)
                    VALUES (CAST(:id AS uuid), :name, :uid, 'enterprise', TRUE)
                    """
                ),
                {"id": store_id, "name": DEMO_STORE_NAME, "uid": user_id},
            )
        out["store_id"] = store_id

        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.memberships (user_id, store_id, role, status, accepted_at)
                VALUES (:uid, CAST(:sid AS uuid), 'SELLER_OWNER', 'active', NOW())
                ON CONFLICT (user_id, store_id) DO UPDATE SET role = 'SELLER_OWNER', status = 'active'
                """
            ),
            {"uid": user_id, "sid": store_id},
        )
        out["membership"] = "SELLER_OWNER"
        out["status"] = "ok"
    except Exception as exc:
        logger.warning("identity_seed_partial err=%s", exc)
        out["status"] = "partial"
        out["error"] = str(exc)
    return out


async def _seed_financial(session: AsyncSession, user_id: str) -> dict[str, Any]:
    try:
        from app.financial_platform.domain.enums import OwnerType
        from app.financial_platform.services import (
            CashbackService,
            StoreCreditService,
            WalletFacadeService,
        )

        await WalletFacadeService(session).ensure_subject_accounts(
            owner_type=OwnerType.BUYER, owner_id=user_id
        )
        await StoreCreditService(session).issue(
            owner_id=user_id, amount_cents=5000, reason="demo_seed"
        )
        await CashbackService(session).grant(user_id=user_id, amount_cents=1000)
        return {"status": "ok", "store_credit_cents": 5000, "cashback_cents": 1000}
    except Exception as exc:
        logger.warning("financial_seed_partial err=%s", exc)
        return {"status": "partial", "error": str(exc)}


async def _seed_tournament(
    session: AsyncSession, user_id: str, identity: dict[str, Any]
) -> dict[str, Any]:
    store_id = identity.get("store_id")
    if not store_id:
        return {"status": "skipped", "reason": "no_store"}
    try:
        from app.tournament_platform.services import EventService

        existing = await EventService(session).list_for_store(store_id)
        demo = next((e for e in existing if e.name == DEMO_EVENT_NAME), None)
        if demo:
            return {"status": "ok", "store_event_id": demo.id, "existing": True}
        ev = await EventService(session).create(
            store_id=store_id,
            name=DEMO_EVENT_NAME,
            organizer_id=user_id,
            description="Demo event for Admin Sandbox",
            game="mtg",
            capacity=32,
        )
        return {"status": "ok", "store_event_id": ev.id}
    except Exception as exc:
        logger.warning("tournament_seed_partial err=%s", exc)
        return {"status": "partial", "error": str(exc)}


async def _seed_analytics_stub() -> dict[str, Any]:
    return {"status": "ok", "note": "Top Movers / marts use existing cold-start seeds"}
