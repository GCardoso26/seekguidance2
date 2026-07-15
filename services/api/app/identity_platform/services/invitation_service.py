"""Store invitations."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.identity_platform.domain.enums import (
    InvitationStatus,
    MembershipStatus,
    PlatformRole,
)
from app.identity_platform.services.membership_service import MembershipService


class InvitationService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def invite(
        self,
        actor_id: str,
        store_id: str,
        *,
        email: str,
        role: PlatformRole,
        days_valid: int = 14,
    ) -> dict[str, Any]:
        if role in {PlatformRole.BUYER, PlatformRole.ADMIN, PlatformRole.SUPER_ADMIN}:
            raise HTTPException(400, "Role inválida para convite de loja")
        # Owner/manager gate via membership service helper
        await MembershipService(self._session)._require_team_manage(actor_id, store_id)

        token = secrets.token_urlsafe(32)
        expires = datetime.now(UTC) + timedelta(days=days_valid)
        row = (
            await self._session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.store_invitations (
                      store_id, email, role, token, status, invited_by, expires_at
                    ) VALUES (
                      CAST(:sid AS uuid), :email, :role, :token, :status, :uid, :exp
                    )
                    RETURNING *
                    """
                ),
                {
                    "sid": store_id,
                    "email": email.strip().lower(),
                    "role": role.value,
                    "token": token,
                    "status": InvitationStatus.PENDING.value,
                    "uid": actor_id,
                    "exp": expires,
                },
            )
        ).mappings().first()
        await self._session.commit()
        payload = dict(row) if row else {}
        # No email provider yet — token returned for RC1/staging flows
        payload["invite_url_hint"] = f"/runtime/judge/identity/invitations/{token}/accept"
        return payload

    async def accept(self, user_id: str, token: str) -> dict[str, Any]:
        row = (
            await self._session.execute(
                text(
                    """
                    SELECT * FROM tcg_judge.store_invitations
                    WHERE token = :token
                    LIMIT 1
                    """
                ),
                {"token": token},
            )
        ).mappings().first()
        if not row:
            raise HTTPException(404, "Convite não encontrado")
        if str(row["status"]) != InvitationStatus.PENDING.value:
            raise HTTPException(400, "Convite não está pendente")
        if row.get("expires_at") and row["expires_at"] < datetime.now(UTC):
            await self._session.execute(
                text(
                    """
                    UPDATE tcg_judge.store_invitations
                    SET status = :st, updated_at = NOW()
                    WHERE id = :id
                    """
                ),
                {"st": InvitationStatus.EXPIRED.value, "id": row["id"]},
            )
            await self._session.commit()
            raise HTTPException(400, "Convite expirado")

        try:
            role = PlatformRole(str(row["role"]))
        except ValueError as exc:
            raise HTTPException(400, "Role inválida no convite") from exc

        membership = await MembershipService(self._session).upsert(
            str(row["invited_by"]),
            str(row["store_id"]),
            user_id,
            role,
            MembershipStatus.ACTIVE,
        )
        await self._session.execute(
            text(
                """
                UPDATE tcg_judge.store_invitations
                SET status = :st, accepted_by = :uid, accepted_at = NOW(), updated_at = NOW()
                WHERE id = :id
                """
            ),
            {"st": InvitationStatus.ACCEPTED.value, "uid": user_id, "id": row["id"]},
        )
        await self._session.commit()
        return {"membership": membership, "invitation_id": str(row["id"])}

    async def revoke(self, actor_id: str, invitation_id: str) -> dict[str, Any]:
        row = (
            await self._session.execute(
                text("SELECT * FROM tcg_judge.store_invitations WHERE id = CAST(:id AS uuid)"),
                {"id": invitation_id},
            )
        ).mappings().first()
        if not row:
            raise HTTPException(404, "Convite não encontrado")
        await MembershipService(self._session)._require_team_manage(actor_id, str(row["store_id"]))
        await self._session.execute(
            text(
                """
                UPDATE tcg_judge.store_invitations
                SET status = :st, updated_at = NOW()
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {"st": InvitationStatus.REVOKED.value, "id": invitation_id},
        )
        await self._session.commit()
        return {"ok": True, "id": invitation_id}
