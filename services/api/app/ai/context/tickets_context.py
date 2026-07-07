from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import seller_tickets as tickets_svc


class TicketsContextProvider:
    name = "tickets"

    async def fetch(self, session: AsyncSession, owner_id: str, store_id: str) -> dict:
        open_tickets = await tickets_svc.list_tickets(session, owner_id, status="open", limit=10)
        waiting = await tickets_svc.list_tickets(session, owner_id, status="waiting_customer", limit=5)
        items = (open_tickets.get("items") or []) + (waiting.get("items") or [])
        return {
            "open_count": int(open_tickets.get("total") or len(open_tickets.get("items") or [])),
            "waiting_count": int(waiting.get("total") or len(waiting.get("items") or [])),
            "items": items[:10],
        }
