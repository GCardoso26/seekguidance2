"""MembershipService — User ↔ Store via role+status (no boolean role flags)."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.identity_platform.adapters.rc1_membership import resolve_platform_role_for_store
from app.identity_platform.adapters.rc1_store import get_store_row
from app.identity_platform.domain.enums import (
    MembershipStatus,
    PlatformRole,
    map_platform_role_to_legacy,
)
from app.identity_platform.services.company_service import dual_write_enabled


class MembershipService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_for_store(self, actor_id: str, store_id: str) -> list[dict[str, Any]]:
        await self._require_team_view(actor_id, store_id)
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT id, user_id, store_id, role, status, invited_by, created_at, accepted_at
                    FROM tcg_judge.memberships
                    WHERE store_id = CAST(:sid AS uuid)
                    ORDER BY created_at ASC
                    """
                ),
                {"sid": store_id},
            )
        ).mappings().all()
        if rows:
            return [dict(r) for r in rows]

        # Project legacy
        projected: list[dict[str, Any]] = []
        store = await get_store_row(self._session, store_id)
        if store:
            projected.append(
                {
                    "id": f"legacy-owner-{store_id}",
                    "user_id": store["owner_id"],
                    "store_id": store_id,
                    "role": PlatformRole.SELLER_OWNER.value,
                    "status": MembershipStatus.ACTIVE.value,
                    "invited_by": None,
                    "source": "rc1_owner",
                }
            )
        legacy = (
            await self._session.execute(
                text(
                    """
                    SELECT id, user_id, store_id, role, is_active, created_at
                    FROM tcg_judge.store_user_roles
                    WHERE store_id = CAST(:sid AS uuid)
                    """
                ),
                {"sid": store_id},
            )
        ).mappings().all()
        from app.identity_platform.domain.enums import map_legacy_role

        for r in legacy:
            projected.append(
                {
                    "id": str(r["id"]),
                    "user_id": r["user_id"],
                    "store_id": store_id,
                    "role": map_legacy_role(str(r["role"])).value,
                    "status": (
                        MembershipStatus.ACTIVE.value
                        if r.get("is_active")
                        else MembershipStatus.SUSPENDED.value
                    ),
                    "source": "rc1_store_user_roles",
                }
            )
        return projected

    async def upsert(
        self,
        actor_id: str,
        store_id: str,
        user_id: str,
        role: PlatformRole,
        status: MembershipStatus = MembershipStatus.ACTIVE,
    ) -> dict[str, Any]:
        await self._require_team_manage(actor_id, store_id)
        if role == PlatformRole.BUYER:
            raise HTTPException(400, "BUYER não é membership de loja")
        row = (
            await self._session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.memberships (
                      user_id, store_id, role, status, invited_by, accepted_at
                    ) VALUES (
                      :uid, CAST(:sid AS uuid), :role, :status, :inv, NOW()
                    )
                    ON CONFLICT (user_id, store_id) DO UPDATE SET
                      role = EXCLUDED.role,
                      status = EXCLUDED.status,
                      updated_at = NOW()
                    RETURNING *
                    """
                ),
                {
                    "uid": user_id,
                    "sid": store_id,
                    "role": role.value,
                    "status": status.value,
                    "inv": actor_id,
                },
            )
        ).mappings().first()

        if dual_write_enabled():
            legacy = map_platform_role_to_legacy(role)
            if legacy:
                await self._session.execute(
                    text(
                        """
                        INSERT INTO tcg_judge.store_user_roles (store_id, user_id, role, is_active)
                        VALUES (CAST(:sid AS uuid), :uid, :role, :active)
                        ON CONFLICT (store_id, user_id) DO UPDATE SET
                          role = EXCLUDED.role,
                          is_active = EXCLUDED.is_active,
                          updated_at = NOW()
                        """
                    ),
                    {
                        "sid": store_id,
                        "uid": user_id,
                        "role": legacy,
                        "active": status == MembershipStatus.ACTIVE,
                    },
                )
        await self._session.commit()
        return dict(row) if row else {}

    async def _require_team_view(self, actor_id: str, store_id: str) -> None:
        from app.identity_platform.permissions import PermissionService

        ok = await PermissionService(self._session).can(
            actor_id, "store.team.view", store_id=store_id
        )
        # Owner always can
        if not ok:
            resolved = await resolve_platform_role_for_store(self._session, actor_id, store_id)
            if resolved and resolved[0] == PlatformRole.SELLER_OWNER:
                return
            raise HTTPException(403, "Sem permissão store.team.view")

    async def _require_team_manage(self, actor_id: str, store_id: str) -> None:
        from app.identity_platform.permissions import PermissionService

        ok = await PermissionService(self._session).can(
            actor_id, "store.team.manage", store_id=store_id
        )
        if not ok:
            resolved = await resolve_platform_role_for_store(self._session, actor_id, store_id)
            if resolved and resolved[0] == PlatformRole.SELLER_OWNER:
                return
            raise HTTPException(403, "Sem permissão store.team.manage")
