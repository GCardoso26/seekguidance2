"""RC1 membership adapter — projects store_user_roles + owner into PlatformRole."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.identity_platform.domain.enums import PlatformRole, map_legacy_role
from app.marketplace.seller_rbac import effective_role_for_owner


async def resolve_platform_role_for_store(
    session: AsyncSession,
    actor_id: str,
    store_id: str,
) -> tuple[PlatformRole, str, dict[str, Any] | None] | None:
    """
    Returns (platform_role, legacy_role, permission_override) or None if no access.
    Prefer memberships table; fall back to store_user_roles / owner_id.
    """
    membership = (
        await session.execute(
            text(
                """
                SELECT role, status FROM tcg_judge.memberships
                WHERE store_id = CAST(:sid AS uuid)
                  AND user_id = :uid
                  AND status = 'active'
                LIMIT 1
                """
            ),
            {"sid": store_id, "uid": actor_id},
        )
    ).mappings().first()
    if membership:
        try:
            role = PlatformRole(str(membership["role"]))
        except ValueError:
            role = PlatformRole.SELLER_STAFF
        from app.identity_platform.domain.enums import map_platform_role_to_legacy

        legacy = map_platform_role_to_legacy(role) or "operator"
        return role, legacy, None

    store = (
        await session.execute(
            text("SELECT owner_id FROM tcg_judge.stores WHERE id = CAST(:sid AS uuid)"),
            {"sid": store_id},
        )
    ).mappings().first()
    if not store:
        return None

    if str(store["owner_id"]) == actor_id:
        legacy = effective_role_for_owner()
        return PlatformRole.SELLER_OWNER, legacy, None

    row = (
        await session.execute(
            text(
                """
                SELECT role, permissions, is_active
                FROM tcg_judge.store_user_roles
                WHERE store_id = CAST(:sid AS uuid) AND user_id = :uid
                LIMIT 1
                """
            ),
            {"sid": store_id, "uid": actor_id},
        )
    ).mappings().first()
    if not row or not row.get("is_active"):
        return None

    legacy = str(row["role"])
    override = row.get("permissions")
    if isinstance(override, str):
        import json

        override = json.loads(override)
    return map_legacy_role(legacy), legacy, override if isinstance(override, dict) else None
