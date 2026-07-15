"""Permission helpers — consume identity_platform PermissionService."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.identity_platform.permissions import PermissionService

# Map judge staff ops → store.events.* permissions
EVENT_PERMISSIONS = {
    "view": "store.events.view",
    "create": "store.events.create",
    "edit": "store.events.edit",
    "checkin": "store.events.checkin",
    "pairings": "store.events.pairings",
    "standings": "store.events.standings",
    "tickets": "store.events.tickets",
    "results": "store.events.results",
    "capacity": "store.events.capacity",
    "prizes": "store.events.prizes",
    "staff": "store.events.staff",
}


async def can_event(
    session: AsyncSession,
    user_id: str,
    *,
    store_id: str | None,
    action: str,
) -> bool:
    if not store_id:
        return False
    perm = EVENT_PERMISSIONS.get(action, f"store.events.{action}")
    return await PermissionService(session).can(user_id, perm, store_id=store_id)
