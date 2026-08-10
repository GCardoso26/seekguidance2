"""Core Tournament Platform services."""

from __future__ import annotations

import json
import secrets
import uuid
from datetime import datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.tournament_platform.adapters.inventory_ticket import (
    ticket_inventory_contract,
    validate_ticket_policy,
)
from app.tournament_platform.adapters.rc1_tournament import (
    get_tournament_row,
)
from app.tournament_platform.domain import (
    EventRegistration,
    EventTicket,
    StoreEvent,
)
from app.tournament_platform.domain.enums import (
    REGISTRATION_TRANSITIONS,
    RegistrationStatus,
    StoreEventStatus,
    StoreEventType,
    StoreEventVisibility,
)
from app.tournament_platform.observability import emit


def _parse_timestamptz(value: str | datetime | None) -> datetime | None:
    """asyncpg exige datetime (não ISO string) em binds tipados como timestamptz."""
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value
    raw = str(value).strip()
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    return datetime.fromisoformat(raw)


def _row_event(row: Any) -> StoreEvent:
    return StoreEvent(
        id=str(row["id"]),
        store_id=str(row["store_id"]),
        name=row["name"],
        description=row.get("description"),
        game=row.get("game"),
        format=row.get("format"),
        category=row.get("category"),
        event_type=StoreEventType(row.get("event_type") or "tournament"),
        capacity=row.get("capacity"),
        starts_at=str(row["starts_at"]) if row.get("starts_at") else None,
        ends_at=str(row["ends_at"]) if row.get("ends_at") else None,
        venue=row.get("venue"),
        status=StoreEventStatus(row.get("status") or "draft"),
        visibility=StoreEventVisibility(row.get("visibility") or "public"),
        image_url=row.get("image_url"),
        banner_url=row.get("banner_url"),
        organizer_id=row.get("organizer_id"),
        rules=row.get("rules"),
        policies=dict(row.get("policies") or {}),
    )


_TICKET_AGG_SQL = """
COALESCE(
  (SELECT SUM(COALESCE(t.availability, 0))
   FROM tcg_judge.event_tickets t
   WHERE t.store_event_id = e.id AND t.status = 'active'),
  e.capacity
) AS tickets_remaining,
COALESCE(
  (SELECT SUM(COALESCE(t.capacity, t.quantity, 0))
   FROM tcg_judge.event_tickets t
   WHERE t.store_event_id = e.id AND t.status = 'active'),
  e.capacity
) AS tickets_capacity,
(SELECT MIN(t.price_cents)
 FROM tcg_judge.event_tickets t
 WHERE t.store_event_id = e.id AND t.status = 'active') AS price_cents,
(SELECT t.store_product_id::text
 FROM tcg_judge.event_tickets t
 WHERE t.store_event_id = e.id AND t.status = 'active' AND t.store_product_id IS NOT NULL
 ORDER BY t.created_at
 LIMIT 1) AS store_product_id
"""


def _dict_from_enriched_row(r: Any) -> dict[str, Any]:
    ev = _row_event(r).to_dict()
    remaining = r.get("tickets_remaining")
    capacity = r.get("tickets_capacity")
    ev["store_name"] = r.get("store_name")
    ev["store_slug"] = r.get("store_slug")
    ev["store_city"] = r.get("store_city")
    ev["store_state"] = r.get("store_state")
    ev["store_postal_code"] = r.get("store_postal_code")
    ev["tickets_remaining"] = int(remaining) if remaining is not None else None
    ev["tickets_capacity"] = int(capacity) if capacity is not None else ev.get("capacity")
    if ev["tickets_capacity"] is not None and ev["tickets_remaining"] is not None:
        ev["tickets_sold"] = max(0, int(ev["tickets_capacity"]) - int(ev["tickets_remaining"]))
    else:
        ev["tickets_sold"] = None
    price = r.get("price_cents")
    ev["price_cents"] = int(price) if price is not None else None
    spid = r.get("store_product_id")
    ev["store_product_id"] = str(spid) if spid else None
    ev["primary_store_product_id"] = ev["store_product_id"]
    return ev


class EventService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        store_id: str,
        name: str,
        organizer_id: str,
        description: str | None = None,
        game: str | None = None,
        format: str | None = None,
        category: str | None = None,
        event_type: StoreEventType = StoreEventType.TOURNAMENT,
        capacity: int | None = None,
        starts_at: str | None = None,
        venue: str | None = None,
        rules: str | None = None,
        policies: dict[str, Any] | None = None,
        banner_url: str | None = None,
        image_url: str | None = None,
        visibility: str | StoreEventVisibility = StoreEventVisibility.PUBLIC,
        status: str | StoreEventStatus = StoreEventStatus.REGISTRATION_OPEN,
    ) -> StoreEvent:
        eid = str(uuid.uuid4())
        vis = (
            visibility.value
            if isinstance(visibility, StoreEventVisibility)
            else str(visibility or "public")
        )
        st = (
            status.value
            if isinstance(status, StoreEventStatus)
            else str(status or "registration_open")
        )
        if vis not in {v.value for v in StoreEventVisibility}:
            vis = StoreEventVisibility.PUBLIC.value
        if st not in {s.value for s in StoreEventStatus}:
            st = StoreEventStatus.REGISTRATION_OPEN.value
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.store_events (
                  id, store_id, name, description, game, format, category,
                  event_type, capacity, starts_at, venue, organizer_id, rules, policies,
                  banner_url, image_url, visibility, status
                ) VALUES (
                  CAST(:id AS uuid), CAST(:store_id AS uuid), :name, :description, :game, :format,
                  :category, :event_type, :capacity,
                  CAST(:starts_at AS timestamptz),
                  :venue, :organizer_id, :rules, CAST(:policies AS jsonb),
                  :banner_url, :image_url, :visibility, :status
                )
                """
            ),
            {
                "id": eid,
                "store_id": store_id,
                "name": name,
                "description": description,
                "game": game,
                "format": format,
                "category": category,
                "event_type": event_type.value,
                "capacity": capacity,
                "starts_at": _parse_timestamptz(starts_at),
                "venue": venue,
                "organizer_id": organizer_id,
                "rules": rules,
                "policies": json.dumps(policies or {}),
                "banner_url": banner_url,
                "image_url": image_url,
                "visibility": vis,
                "status": st,
            },
        )
        await self.session.commit()
        emit("event_created", {"store_event_id": eid, "store_id": store_id})
        ev = await self.get(eid)
        assert ev is not None
        return ev

    async def get(self, event_id: str) -> StoreEvent | None:
        row = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, store_id::text, name, description, game, format, category,
                           event_type, capacity, starts_at, ends_at, venue, status, visibility,
                           image_url, banner_url, organizer_id, rules, policies
                    FROM tcg_judge.store_events WHERE id = CAST(:id AS uuid) LIMIT 1
                    """
                ),
                {"id": event_id},
            )
        ).mappings().first()
        return _row_event(row) if row else None

    async def get_enriched(self, event_id: str) -> dict[str, Any] | None:
        await TicketService(self.session).ensure_products_for_event(event_id)
        row = (
            await self.session.execute(
                text(
                    f"""
                    SELECT e.id::text, e.store_id::text, e.name, e.description, e.game, e.format,
                           e.category, e.event_type, e.capacity, e.starts_at, e.ends_at, e.venue,
                           e.status, e.visibility, e.image_url, e.banner_url, e.organizer_id,
                           e.rules, e.policies,
                           s.name AS store_name, s.slug AS store_slug, s.city AS store_city,
                           s.state AS store_state, s.postal_code AS store_postal_code,
                           {_TICKET_AGG_SQL}
                    FROM tcg_judge.store_events e
                    LEFT JOIN tcg_judge.stores s ON s.id = e.store_id
                    WHERE e.id = CAST(:id AS uuid)
                    LIMIT 1
                    """
                ),
                {"id": event_id},
            )
        ).mappings().first()
        return _dict_from_enriched_row(row) if row else None

    async def update(self, event_id: str, **fields: Any) -> StoreEvent:
        allowed = {
            "name",
            "description",
            "game",
            "format",
            "category",
            "capacity",
            "starts_at",
            "venue",
            "rules",
            "policies",
            "banner_url",
            "image_url",
            "visibility",
            "status",
        }
        sets: list[str] = []
        params: dict[str, Any] = {"id": event_id}
        for key, value in fields.items():
            if key not in allowed:
                continue
            if key == "starts_at":
                sets.append("starts_at = CAST(:starts_at AS timestamptz)")
                params["starts_at"] = _parse_timestamptz(value)
            elif key == "policies":
                sets.append("policies = CAST(:policies AS jsonb)")
                params["policies"] = json.dumps(value or {})
            elif key == "visibility":
                vis = value.value if isinstance(value, StoreEventVisibility) else str(value)
                if vis not in {v.value for v in StoreEventVisibility}:
                    continue
                sets.append("visibility = :visibility")
                params["visibility"] = vis
            elif key == "status":
                st = value.value if isinstance(value, StoreEventStatus) else str(value)
                if st not in {s.value for s in StoreEventStatus}:
                    continue
                sets.append("status = :status")
                params["status"] = st
            else:
                sets.append(f"{key} = :{key}")
                params[key] = value
        if not sets:
            ev = await self.get(event_id)
            if not ev:
                raise HTTPException(status_code=404, detail="event_not_found")
            return ev
        sets.append("updated_at = NOW()")
        await self.session.execute(
            text(
                f"""
                UPDATE tcg_judge.store_events
                SET {", ".join(sets)}
                WHERE id = CAST(:id AS uuid)
                """
            ),
            params,
        )
        await self.session.commit()
        emit("event_updated", {"store_event_id": event_id})
        ev = await self.get(event_id)
        if not ev:
            raise HTTPException(status_code=404, detail="event_not_found")
        return ev

    async def list_for_store(self, store_id: str) -> list[StoreEvent]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, store_id::text, name, description, game, format, category,
                           event_type, capacity, starts_at, ends_at, venue, status, visibility,
                           image_url, banner_url, organizer_id, rules, policies
                    FROM tcg_judge.store_events
                    WHERE store_id = CAST(:store_id AS uuid)
                    ORDER BY starts_at DESC NULLS LAST, created_at DESC
                    LIMIT 100
                    """
                ),
                {"store_id": store_id},
            )
        ).mappings().all()
        return [_row_event(r) for r in rows]

    async def list_for_store_enriched(self, store_id: str, *, limit: int = 100) -> list[dict[str, Any]]:
        rows = (
            await self.session.execute(
                text(
                    f"""
                    SELECT e.id::text, e.store_id::text, e.name, e.description, e.game, e.format,
                           e.category, e.event_type, e.capacity, e.starts_at, e.ends_at, e.venue,
                           e.status, e.visibility, e.image_url, e.banner_url, e.organizer_id,
                           e.rules, e.policies,
                           s.name AS store_name, s.slug AS store_slug, s.city AS store_city,
                           s.state AS store_state, s.postal_code AS store_postal_code,
                           {_TICKET_AGG_SQL}
                    FROM tcg_judge.store_events e
                    LEFT JOIN tcg_judge.stores s ON s.id = e.store_id
                    WHERE e.store_id = CAST(:store_id AS uuid)
                    ORDER BY e.starts_at DESC NULLS LAST, e.created_at DESC
                    LIMIT :lim
                    """
                ),
                {"store_id": store_id, "lim": limit},
            )
        ).mappings().all()
        return [_dict_from_enriched_row(r) for r in rows]

    async def list_public(self, limit: int = 50) -> list[StoreEvent]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, store_id::text, name, description, game, format, category,
                           event_type, capacity, starts_at, ends_at, venue, status, visibility,
                           image_url, banner_url, organizer_id, rules, policies
                    FROM tcg_judge.store_events
                    WHERE visibility = 'public' AND status NOT IN ('draft', 'cancelled')
                    ORDER BY starts_at ASC NULLS LAST
                    LIMIT :lim
                    """
                ),
                {"lim": limit},
            )
        ).mappings().all()
        return [_row_event(r) for r in rows]

    async def list_public_enriched(
        self,
        *,
        limit: int = 50,
        store_id: str | None = None,
        game: str | None = None,
    ) -> list[dict[str, Any]]:
        """Public events with ticket availability + store name for hub/vitrine."""
        clauses = ["e.visibility = 'public'", "e.status NOT IN ('draft', 'cancelled')"]
        params: dict[str, Any] = {"lim": limit}
        if store_id:
            clauses.append("e.store_id = CAST(:store_id AS uuid)")
            params["store_id"] = store_id
        if game:
            clauses.append("UPPER(COALESCE(e.game, '')) = UPPER(:game)")
            params["game"] = game
        where = " AND ".join(clauses)
        rows = (
            await self.session.execute(
                text(
                    f"""
                    SELECT e.id::text, e.store_id::text, e.name, e.description, e.game, e.format,
                           e.category, e.event_type, e.capacity, e.starts_at, e.ends_at, e.venue,
                           e.status, e.visibility, e.image_url, e.banner_url, e.organizer_id,
                           e.rules, e.policies,
                           s.name AS store_name, s.slug AS store_slug, s.city AS store_city,
                           s.state AS store_state, s.postal_code AS store_postal_code,
                           {_TICKET_AGG_SQL}
                    FROM tcg_judge.store_events e
                    LEFT JOIN tcg_judge.stores s ON s.id = e.store_id
                    WHERE {where}
                    ORDER BY e.starts_at ASC NULLS LAST
                    LIMIT :lim
                    """
                ),
                params,
            )
        ).mappings().all()
        return [_dict_from_enriched_row(r) for r in rows]

    async def ensure_from_tournament(
        self, tournament_id: str, *, store_id: str, organizer_id: str
    ) -> StoreEvent:
        t = await get_tournament_row(self.session, tournament_id)
        if not t:
            raise HTTPException(status_code=404, detail="tournament_not_found")
        if t.get("store_event_id"):
            existing = await self.get(t["store_event_id"])
            if existing:
                return existing
        ev = await self.create(
            store_id=store_id,
            name=t.get("name") or "Tournament Event",
            organizer_id=organizer_id,
            game=t.get("game"),
            format=t.get("format"),
        )
        await TournamentOrgService(self.session).link(ev.id, tournament_id, store_id=store_id)
        return ev


class TournamentOrgService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def link(self, store_event_id: str, tournament_id: str, *, store_id: str | None = None) -> None:
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.store_event_tournaments (store_event_id, tournament_id)
                VALUES (CAST(:eid AS uuid), CAST(:tid AS uuid))
                ON CONFLICT (store_event_id, tournament_id) DO NOTHING
                """
            ),
            {"eid": store_event_id, "tid": tournament_id},
        )
        await self.session.execute(
            text(
                """
                UPDATE tcg_judge.tournaments
                SET store_event_id = CAST(:eid AS uuid),
                    store_id = COALESCE(store_id, CAST(:store_id AS uuid))
                WHERE id = CAST(:tid AS uuid)
                """
            ),
            {"eid": store_event_id, "tid": tournament_id, "store_id": store_id},
        )
        await self.session.commit()

    async def list_tournaments(self, store_event_id: str) -> list[dict[str, Any]]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT t.id::text AS id, t.name, t.status, t.phase, t.current_round
                    FROM tcg_judge.store_event_tournaments set
                    JOIN tcg_judge.tournaments t ON t.id = set.tournament_id
                    WHERE set.store_event_id = CAST(:eid AS uuid)
                    ORDER BY set.sort_order, t.created_at
                    """
                ),
                {"eid": store_event_id},
            )
        ).mappings().all()
        return [dict(r) for r in rows]

    async def get_tournament_view(self, tournament_id: str) -> dict[str, Any] | None:
        return await get_tournament_row(self.session, tournament_id)


class TicketService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _event_context(self, store_event_id: str) -> dict[str, Any]:
        row = (
            await self.session.execute(
                text(
                    """
                    SELECT e.id::text, e.store_id::text, e.name, e.game, e.banner_url, e.image_url
                    FROM tcg_judge.store_events e
                    WHERE e.id = CAST(:eid AS uuid)
                    LIMIT 1
                    """
                ),
                {"eid": store_event_id},
            )
        ).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="event_not_found")
        return dict(row)

    async def _upsert_ticket_product(
        self,
        *,
        ticket_id: str,
        store_id: str,
        product_name: str,
        price_cents: int,
        stock: int,
        tcg_id: str | None,
        banner_url: str | None,
        store_product_id: str | None,
        store_event_id: str,
    ) -> str:
        images = [banner_url] if banner_url else []
        sku = f"event_ticket:{ticket_id}"
        description = f"Ingresso do evento · event_id={store_event_id} · ticket_id={ticket_id}"
        if store_product_id:
            await self.session.execute(
                text(
                    """
                    UPDATE tcg_judge.store_products
                    SET name = :name,
                        description = :desc,
                        tcg_id = :tcg,
                        price_cents = :price,
                        stock = :stock,
                        images = CAST(:images AS text[]),
                        sku = :sku,
                        category = 'event',
                        is_active = true,
                        updated_at = NOW()
                    WHERE id = CAST(:pid AS uuid)
                    """
                ),
                {
                    "pid": store_product_id,
                    "name": product_name[:200],
                    "desc": description,
                    "tcg": (tcg_id or "MTG")[:32],
                    "price": max(0, int(price_cents)),
                    "stock": max(0, int(stock)),
                    "images": images,
                    "sku": sku,
                },
            )
            return store_product_id

        row = (
            await self.session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.store_products (
                      store_id, name, description, tcg_id, category,
                      price_cents, stock, reserved_stock, images, sku, is_active
                    ) VALUES (
                      CAST(:sid AS uuid), :name, :desc, :tcg, 'event',
                      :price, :stock, 0, CAST(:images AS text[]), :sku, true
                    )
                    RETURNING id::text
                    """
                ),
                {
                    "sid": store_id,
                    "name": product_name[:200],
                    "desc": description,
                    "tcg": (tcg_id or "MTG")[:32],
                    "price": max(0, int(price_cents)),
                    "stock": max(0, int(stock)),
                    "images": images,
                    "sku": sku,
                },
            )
        ).mappings().first()
        if not row:
            raise HTTPException(status_code=500, detail="ticket_product_create_failed")
        return str(row["id"])

    async def create(
        self,
        *,
        store_event_id: str,
        name: str = "Entry",
        price_cents: int = 0,
        quantity: int = 0,
        capacity: int | None = None,
        tournament_id: str | None = None,
        store_product_id: str | None = None,
        lot: str | None = None,
    ) -> EventTicket:
        ctx = await self._event_context(store_event_id)
        ticket_id = str(uuid.uuid4())
        cap = capacity if capacity is not None else quantity
        product_name = f"{ctx['name']} — {name}" if name and name != ctx["name"] else str(ctx["name"])
        if not store_product_id:
            store_product_id = await self._upsert_ticket_product(
                ticket_id=ticket_id,
                store_id=str(ctx["store_id"]),
                product_name=product_name,
                price_cents=price_cents,
                stock=int(cap or quantity or 0),
                tcg_id=ctx.get("game"),
                banner_url=ctx.get("banner_url") or ctx.get("image_url"),
                store_product_id=None,
                store_event_id=store_event_id,
            )
        ticket = EventTicket(
            id=ticket_id,
            store_event_id=store_event_id,
            name=name,
            price_cents=price_cents,
            quantity=quantity,
            capacity=cap,
            availability=quantity,
            tournament_id=tournament_id,
            store_product_id=store_product_id,
            lot=lot,
            online_payment_required=False,
            counter_payment_forbidden=False,
        )
        errs = validate_ticket_policy(ticket)
        if errs:
            raise HTTPException(status_code=400, detail={"policy_errors": errs})
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.event_tickets (
                  id, store_event_id, tournament_id, name, price_cents, quantity, capacity,
                  availability, lot, require_checkin, online_payment_required,
                  counter_payment_forbidden, store_product_id, status
                ) VALUES (
                  CAST(:id AS uuid), CAST(:eid AS uuid),
                  CAST(:tid AS uuid),
                  :name, :price, :qty, :capacity, :avail, :lot, TRUE, FALSE, FALSE,
                  CAST(:spid AS uuid),
                  'active'
                )
                """
            ),
            {
                "id": ticket.id,
                "eid": store_event_id,
                "tid": tournament_id,
                "name": name,
                "price": price_cents,
                "qty": quantity,
                "capacity": cap,
                "avail": quantity,
                "lot": lot,
                "spid": store_product_id,
            },
        )
        await self.session.commit()
        emit("ticket_created", {"ticket_id": ticket.id, "store_event_id": store_event_id})
        return ticket

    async def get(self, ticket_id: str) -> dict[str, Any] | None:
        row = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, store_event_id::text, tournament_id::text, name, price_cents,
                           quantity, capacity, availability, lot, sales_deadline::text,
                           require_checkin, online_payment_required, counter_payment_forbidden,
                           store_product_id::text, currency, status
                    FROM tcg_judge.event_tickets
                    WHERE id = CAST(:id AS uuid)
                    LIMIT 1
                    """
                ),
                {"id": ticket_id},
            )
        ).mappings().first()
        return dict(row) if row else None

    async def ensure_products_for_event(self, store_event_id: str) -> None:
        """Backfill store_product mirror for tickets still sem produto (eventos antigos)."""
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, store_event_id::text, name, price_cents, quantity, capacity,
                           store_product_id::text
                    FROM tcg_judge.event_tickets
                    WHERE store_event_id = CAST(:eid AS uuid)
                      AND status = 'active'
                      AND store_product_id IS NULL
                    """
                ),
                {"eid": store_event_id},
            )
        ).mappings().all()
        if not rows:
            return
        ctx = await self._event_context(store_event_id)
        for r in rows:
            tid = str(r["id"])
            stock = int(r.get("capacity") or r.get("quantity") or 0)
            product_name = (
                f"{ctx['name']} — {r['name']}"
                if r.get("name") and r["name"] != ctx["name"]
                else str(ctx["name"])
            )
            prod_id = await self._upsert_ticket_product(
                ticket_id=tid,
                store_id=str(ctx["store_id"]),
                product_name=product_name,
                price_cents=int(r.get("price_cents") or 0),
                stock=stock,
                tcg_id=ctx.get("game"),
                banner_url=ctx.get("banner_url") or ctx.get("image_url"),
                store_product_id=None,
                store_event_id=store_event_id,
            )
            await self.session.execute(
                text(
                    """
                    UPDATE tcg_judge.event_tickets
                    SET store_product_id = CAST(:spid AS uuid)
                    WHERE id = CAST(:id AS uuid)
                    """
                ),
                {"id": tid, "spid": prod_id},
            )
        await self.session.commit()

    async def update(
        self,
        ticket_id: str,
        *,
        price_cents: int | None = None,
        quantity: int | None = None,
        capacity: int | None = None,
        availability: int | None = None,
    ) -> dict[str, Any]:
        current = await self.get(ticket_id)
        if not current:
            raise HTTPException(status_code=404, detail="ticket_not_found")
        sets: list[str] = []
        params: dict[str, Any] = {"id": ticket_id}
        if price_cents is not None:
            if price_cents < 0:
                raise HTTPException(status_code=400, detail="price_cents_invalid")
            sets.append("price_cents = :price")
            params["price"] = price_cents
        if quantity is not None:
            sets.append("quantity = :qty")
            params["qty"] = quantity
        if capacity is not None:
            sets.append("capacity = :capacity")
            params["capacity"] = capacity
        if availability is not None:
            sets.append("availability = :avail")
            params["avail"] = availability
        elif capacity is not None and quantity is not None:
            # realinha disponibilidade sem inventar vendas: sold = old_cap - old_avail
            old_cap = int(current.get("capacity") or current.get("quantity") or 0)
            old_avail = int(current.get("availability") or 0)
            sold = max(0, old_cap - old_avail)
            new_cap = int(capacity)
            sets.append("availability = :avail")
            params["avail"] = max(0, new_cap - sold)
        elif capacity is not None:
            old_cap = int(current.get("capacity") or current.get("quantity") or 0)
            old_avail = int(current.get("availability") or 0)
            sold = max(0, old_cap - old_avail)
            sets.append("availability = :avail")
            params["avail"] = max(0, int(capacity) - sold)
        if not sets:
            return current
        await self.session.execute(
            text(
                f"""
                UPDATE tcg_judge.event_tickets
                SET {", ".join(sets)}
                WHERE id = CAST(:id AS uuid)
                """
            ),
            params,
        )
        updated_mid = await self.get(ticket_id)
        assert updated_mid is not None
        ctx = await self._event_context(str(updated_mid["store_event_id"]))
        new_stock = int(updated_mid.get("capacity") or updated_mid.get("quantity") or 0)
        product_name = (
            f"{ctx['name']} — {updated_mid['name']}"
            if updated_mid.get("name") and updated_mid["name"] != ctx["name"]
            else str(ctx["name"])
        )
        prod_id = await self._upsert_ticket_product(
            ticket_id=ticket_id,
            store_id=str(ctx["store_id"]),
            product_name=product_name,
            price_cents=int(updated_mid.get("price_cents") or 0),
            stock=new_stock,
            tcg_id=ctx.get("game"),
            banner_url=ctx.get("banner_url") or ctx.get("image_url"),
            store_product_id=updated_mid.get("store_product_id"),
            store_event_id=str(updated_mid["store_event_id"]),
        )
        if not updated_mid.get("store_product_id"):
            await self.session.execute(
                text(
                    """
                    UPDATE tcg_judge.event_tickets
                    SET store_product_id = CAST(:spid AS uuid)
                    WHERE id = CAST(:id AS uuid)
                    """
                ),
                {"id": ticket_id, "spid": prod_id},
            )
        await self.session.execute(
            text(
                """
                UPDATE tcg_judge.event_tickets t
                SET availability = GREATEST(
                  COALESCE(
                    (SELECT p.stock - COALESCE(p.reserved_stock, 0)
                     FROM tcg_judge.store_products p
                     WHERE p.id = t.store_product_id),
                    t.availability
                  ),
                  0
                )
                WHERE t.id = CAST(:id AS uuid)
                """
            ),
            {"id": ticket_id},
        )
        await self.session.commit()
        emit("ticket_updated", {"ticket_id": ticket_id})
        updated = await self.get(ticket_id)
        assert updated is not None
        return updated

    async def list_for_event(self, store_event_id: str) -> list[dict[str, Any]]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, store_event_id::text, tournament_id::text, name, price_cents,
                           quantity, capacity, availability, lot, sales_deadline::text,
                           require_checkin, online_payment_required, counter_payment_forbidden,
                           store_product_id::text, currency, status
                    FROM tcg_judge.event_tickets
                    WHERE store_event_id = CAST(:eid AS uuid)
                    ORDER BY created_at
                    """
                ),
                {"eid": store_event_id},
            )
        ).mappings().all()
        out = []
        for r in rows:
            t = EventTicket(
                id=r["id"],
                store_event_id=r["store_event_id"],
                name=r["name"],
                price_cents=r["price_cents"],
                quantity=r["quantity"],
                capacity=r.get("capacity"),
                availability=r.get("availability"),
                lot=r.get("lot"),
                sales_deadline=r.get("sales_deadline"),
                require_checkin=r["require_checkin"],
                online_payment_required=r["online_payment_required"],
                counter_payment_forbidden=r["counter_payment_forbidden"],
                store_product_id=r.get("store_product_id"),
                tournament_id=r.get("tournament_id"),
                currency=r.get("currency") or "BRL",
                status=r.get("status") or "active",
            )
            out.append({**t.to_dict(), "inventory_contract": ticket_inventory_contract(t)})
        return out


class RegistrationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def can_transition(self, current: RegistrationStatus, nxt: RegistrationStatus) -> bool:
        return nxt in REGISTRATION_TRANSITIONS.get(current, frozenset())

    async def create(
        self,
        *,
        store_event_id: str,
        user_id: str,
        tournament_id: str | None = None,
        ticket_id: str | None = None,
    ) -> EventRegistration:
        rid = str(uuid.uuid4())
        qr = secrets.token_urlsafe(16)
        await self.session.execute(
            text(
                """
                INSERT INTO tcg_judge.event_registrations (
                  id, store_event_id, tournament_id, ticket_id, user_id, status, qr_code
                ) VALUES (
                  CAST(:id AS uuid), CAST(:eid AS uuid),
                  CASE WHEN :tid IS NULL THEN NULL ELSE CAST(:tid AS uuid) END,
                  CASE WHEN :ticket IS NULL THEN NULL ELSE CAST(:ticket AS uuid) END,
                  :uid, 'pending_payment', :qr
                )
                """
            ),
            {
                "id": rid,
                "eid": store_event_id,
                "tid": tournament_id,
                "ticket": ticket_id,
                "uid": user_id,
                "qr": qr,
            },
        )
        await self.session.commit()
        emit("registration_created", {"registration_id": rid, "user_id": user_id})
        return EventRegistration(
            id=rid,
            store_event_id=store_event_id,
            user_id=user_id,
            tournament_id=tournament_id,
            ticket_id=ticket_id,
            qr_code=qr,
            status=RegistrationStatus.PENDING_PAYMENT,
        )

    async def advance(self, registration_id: str, to_status: RegistrationStatus) -> EventRegistration:
        row = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, store_event_id::text, tournament_id::text, ticket_id::text,
                           user_id, status, payment_ref, qr_code, participant_id::text
                    FROM tcg_judge.event_registrations WHERE id = CAST(:id AS uuid) LIMIT 1
                    """
                ),
                {"id": registration_id},
            )
        ).mappings().first()
        if not row:
            raise HTTPException(status_code=404, detail="registration_not_found")
        current = RegistrationStatus(row["status"])
        if not self.can_transition(current, to_status):
            raise HTTPException(
                status_code=400,
                detail=f"invalid_transition:{current.value}->{to_status.value}",
            )
        extra = ""
        if to_status == RegistrationStatus.CONFIRMED:
            extra = ", confirmed_at = NOW()"
        if to_status == RegistrationStatus.CHECKED_IN:
            extra = ", checked_in_at = NOW()"
        await self.session.execute(
            text(
                f"""
                UPDATE tcg_judge.event_registrations
                SET status = :st, updated_at = NOW(){extra}
                WHERE id = CAST(:id AS uuid)
                """
            ),
            {"st": to_status.value, "id": registration_id},
        )
        await self.session.commit()
        return EventRegistration(
            id=row["id"],
            store_event_id=row["store_event_id"],
            user_id=row["user_id"],
            tournament_id=row.get("tournament_id"),
            ticket_id=row.get("ticket_id"),
            participant_id=row.get("participant_id"),
            payment_ref=row.get("payment_ref"),
            qr_code=row.get("qr_code"),
            status=to_status,
        )

    async def list_for_event(self, store_event_id: str) -> list[dict[str, Any]]:
        rows = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, store_event_id::text, tournament_id::text, ticket_id::text,
                           user_id, status, payment_ref, qr_code, participant_id::text,
                           created_at::text, checked_in_at::text
                    FROM tcg_judge.event_registrations
                    WHERE store_event_id = CAST(:eid AS uuid)
                    ORDER BY created_at DESC
                    """
                ),
                {"eid": store_event_id},
            )
        ).mappings().all()
        return [dict(r) for r in rows]

    async def get_for_user_tournament(
        self, user_id: str, tournament_id: str
    ) -> dict[str, Any] | None:
        row = (
            await self.session.execute(
                text(
                    """
                    SELECT id::text, store_event_id::text, tournament_id::text, status,
                           qr_code, checked_in_at::text
                    FROM tcg_judge.event_registrations
                    WHERE user_id = :uid AND tournament_id = CAST(:tid AS uuid)
                    LIMIT 1
                    """
                ),
                {"uid": user_id, "tid": tournament_id},
            )
        ).mappings().first()
        return dict(row) if row else None
