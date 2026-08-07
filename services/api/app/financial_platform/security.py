"""Idempotency + audit trail + access control helpers."""

from __future__ import annotations

import json
import uuid
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.identity_platform.permissions import PermissionService


def new_correlation_id() -> str:
    return str(uuid.uuid4())


async def require_fresh_idempotency(
    session: AsyncSession, table: str, key: str
) -> None:
    """Raise 409 if idempotency key already used in named table with column idempotency_key."""
    if not key or not key.strip():
        raise HTTPException(status_code=400, detail="idempotency_key_required")
    allowed = {
        "fin_journals",
        "fin_transactions",
        "fin_payout_requests",
        "fin_refund_cases",
    }
    if table not in allowed:
        raise HTTPException(status_code=500, detail="invalid_idempotency_table")
    row = (
        await session.execute(
            text(f"SELECT 1 FROM tcg_judge.{table} WHERE idempotency_key = :k LIMIT 1"),
            {"k": key},
        )
    ).first()
    if row:
        raise HTTPException(status_code=409, detail="idempotency_conflict")


async def write_audit(
    session: AsyncSession,
    *,
    action: str,
    actor_id: str | None,
    correlation_id: str | None,
    origin: str | None = "financial_platform",
    ledger_journal_id: str | None = None,
    payload: dict[str, Any] | None = None,
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.fin_audit_log (
              action, actor_id, correlation_id, origin, ledger_journal_id, payload
            ) VALUES (
              :action, :actor, :corr, :origin,
              CASE WHEN :jid IS NULL THEN NULL ELSE CAST(:jid AS uuid) END,
              CAST(:payload AS jsonb)
            )
            """
        ),
        {
            "action": action,
            "actor": actor_id,
            "corr": correlation_id,
            "origin": origin,
            "jid": ledger_journal_id,
            "payload": json.dumps(payload or {}),
        },
    )


def assert_balanced(lines: list[tuple[int, int]]) -> None:
    """Each tuple is (debit_cents, credit_cents)."""
    debits = sum(d for d, _ in lines)
    credits = sum(c for _, c in lines)
    if debits != credits or debits <= 0:
        raise HTTPException(
            status_code=400,
            detail=f"unbalanced_journal:debit={debits}:credit={credits}",
        )


async def require_platform_admin(session: AsyncSession, actor_id: str) -> None:
    ok = await PermissionService(session).can(actor_id, "platform.admin")
    if not ok:
        raise HTTPException(status_code=403, detail="platform_admin_required")


async def require_store_finance(
    session: AsyncSession,
    actor_id: str,
    store_id: str,
    permission: str = "store.finance.view",
) -> None:
    """Owner/finance role na loja, ou platform admin."""
    perms = PermissionService(session)
    if await perms.can(actor_id, "platform.admin"):
        return
    if await perms.can(actor_id, permission, store_id=store_id):
        return
    owned = (
        await session.execute(
            text(
                """
                SELECT 1 FROM tcg_judge.stores
                WHERE id = CAST(:sid AS uuid) AND owner_id = :uid
                LIMIT 1
                """
            ),
            {"sid": store_id, "uid": actor_id},
        )
    ).first()
    if owned and permission.startswith("store.finance."):
        return
    raise HTTPException(status_code=403, detail="store_finance_forbidden")


async def assert_subject_self_or_admin(
    session: AsyncSession,
    actor_id: str,
    subject_id: str,
) -> None:
    if subject_id == actor_id:
        return
    await require_platform_admin(session, actor_id)
