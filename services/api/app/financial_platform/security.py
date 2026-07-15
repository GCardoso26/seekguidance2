"""Idempotency + audit trail helpers."""

from __future__ import annotations

import json
import uuid
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


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
