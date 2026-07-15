"""Conta do jogador — CPF obrigatório para compras."""

from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.kyc.cpf import cpf_last4, hash_cpf, is_valid_cpf, lookup_cpf_external
from app.players.store import ensure_player_profile, get_profile_by_id


async def _log_audit(
    session: AsyncSession,
    *,
    user_id: str,
    old_status: str | None,
    new_status: str,
    reason: str | None = None,
    provider_event_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.kyc_audit_logs
              (user_id, entity_type, old_status, new_status, reason, provider_event_id, metadata)
            VALUES (:uid, 'player', :old, :new, :reason, :evt, CAST(:meta AS jsonb))
            """
        ),
        {
            "uid": user_id,
            "old": old_status,
            "new": new_status,
            "reason": reason,
            "evt": provider_event_id,
            "meta": json.dumps(metadata or {}),
        },
    )


async def get_account_status(session: AsyncSession, user_id: str) -> dict[str, Any]:
    await ensure_player_profile(session, user_id)
    prof = await get_profile_by_id(session, user_id)
    if not prof:
        raise HTTPException(404, "Perfil não encontrado")
    return {
        "account_status": prof.get("account_status") or "pending_cpf",
        "cpf_last4": prof.get("cpf_last4"),
        "cpf_verified": bool(prof.get("cpf_verified_at")),
        "can_purchase": (prof.get("account_status") == "active"),
    }


async def require_active_account(session: AsyncSession, user_id: str) -> None:
    status = await get_account_status(session, user_id)
    if not status["can_purchase"]:
        raise HTTPException(
            403,
            detail={
                "code": "cpf_required",
                "message": "Insira e valide seu CPF para realizar compras.",
                "account_status": status["account_status"],
            },
        )


async def verify_and_bind_cpf(
    session: AsyncSession,
    user_id: str,
    cpf: str,
    *,
    user_email: str | None = None,
) -> dict[str, Any]:
    await ensure_player_profile(session, user_id)
    prof = await get_profile_by_id(session, user_id)
    if not prof:
        raise HTTPException(404, "Perfil não encontrado")

    if prof.get("account_status") == "active" and (
        prof.get("cpf_hash") or prof.get("cpf_verified_at")
    ):
        return {
            "account_status": "active",
            "cpf_last4": prof.get("cpf_last4"),
            "already_verified": True,
        }

    if not is_valid_cpf(cpf):
        raise HTTPException(
            400,
            detail={
                "code": "cpf_invalid",
                "message": "Documento inválido. Informe novamente um CPF válido.",
            },
        )

    cpf_h = hash_cpf(cpf)
    existing = (
        await session.execute(
            text(
                """
                SELECT id, account_status FROM tcg_judge.player_profiles
                WHERE cpf_hash = :h AND id <> :uid
                """
            ),
            {"h": cpf_h, "uid": user_id},
        )
    ).mappings().first()
    if existing:
        raise HTTPException(
            409,
            detail={
                "code": "cpf_already_registered",
                "message": (
                    "Este CPF já está vinculado a outra conta. "
                    "Se você já se cadastrou antes, faça login com o e-mail original."
                ),
                "login_url": "/entrar",
            },
        )

    ok, lookup_err = await lookup_cpf_external(cpf)
    if not ok:
        raise HTTPException(
            400,
            detail={"code": "cpf_lookup_failed", "message": lookup_err or "CPF não validado"},
        )

    old_status = str(prof.get("account_status") or "pending_cpf")
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.player_profiles
                SET cpf_hash = :h,
                    cpf_last4 = :last4,
                    cpf_verified_at = NOW(),
                    account_status = 'active',
                    cpf_hash_version = 2,
                    updated_at = NOW()
                WHERE id = :uid
                RETURNING account_status, cpf_last4
                """
            ),
            {"h": cpf_h, "last4": cpf_last4(cpf), "uid": user_id},
        )
    ).mappings().first()
    await _log_audit(
        session,
        user_id=user_id,
        old_status=old_status,
        new_status="active",
        reason="cpf_verified",
        metadata={"email": user_email} if user_email else None,
    )
    await session.commit()
    return {
        "account_status": row["account_status"] if row else "active",
        "cpf_last4": row["cpf_last4"] if row else cpf_last4(cpf),
        "already_verified": False,
    }
