"""PermissionService — callers must use can(), never role == owner."""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.identity_platform.adapters.rc1_membership import resolve_platform_role_for_store
from app.identity_platform.domain.enums import PlatformRole
from app.identity_platform.permissions.registry import (
    LEGACY_MODULE_ACTION_TO_PERMISSION,
    PERMISSIONS,
    role_has_permission,
)
from app.marketplace.seller_rbac import has_store_permission


class PermissionService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def can(
        self,
        actor_id: str,
        permission: str,
        *,
        store_id: str | None = None,
        company_id: str | None = None,
        actor_email: str | None = None,
    ) -> bool:
        # Business Program 3.5 — sandbox SUPER_ADMIN elevation (never in production)
        try:
            from app.sandbox.entitlements import is_sandbox_admin

            if is_sandbox_admin(actor_email, actor_id):
                return permission in PERMISSIONS or permission.startswith("store.")
        except Exception:
            pass

        if permission not in PERMISSIONS:
            return False

        if permission == "platform.admin":
            return await self._is_platform_admin(actor_id)

        if store_id is None and company_id is None:
            return False

        if store_id:
            resolved = await resolve_platform_role_for_store(self._session, actor_id, store_id)
            if resolved is None:
                return False
            role, legacy_role, override = resolved
            if role_has_permission(role, permission):
                return True
            for (module, action), perm in LEGACY_MODULE_ACTION_TO_PERMISSION.items():
                if perm == permission:
                    return has_store_permission(legacy_role, override, module, action)
            return False

        if company_id and permission.startswith("company."):
            return await self._is_company_rep(actor_id, company_id)

        return False

    async def _is_platform_admin(self, actor_id: str) -> bool:
        row = (
            await self._session.execute(
                text("SELECT role FROM tcg_judge.judge_profiles WHERE id = :uid"),
                {"uid": actor_id},
            )
        ).mappings().first()
        if not row:
            return False
        return str(row.get("role") or "") in {"admin", "head_judge"}

    async def _is_company_rep(self, actor_id: str, company_id: str) -> bool:
        row = (
            await self._session.execute(
                text(
                    """
                    SELECT 1 FROM tcg_judge.company_representatives
                    WHERE company_id = CAST(:cid AS uuid) AND user_id = :uid
                    LIMIT 1
                    """
                ),
                {"cid": company_id, "uid": actor_id},
            )
        ).first()
        return row is not None


def can_sync(role: PlatformRole, permission: str) -> bool:
    return role_has_permission(role, permission)
