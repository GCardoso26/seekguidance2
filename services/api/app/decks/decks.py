"""CRUD de decks do deckbuilder."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.search_service import _card_payload
from app.gamification.xp import award_xp
from app.players.store import ensure_player_profile

VALID_ZONES = frozenset({"main", "sideboard", "commander", "companion"})


def _parse_uuid(value: str, *, field: str = "id") -> UUID:
    try:
        return UUID(str(value))
    except ValueError as exc:
        raise HTTPException(400, f"{field} inválido") from exc


def _max_copies(format_name: str) -> int:
    return 1 if format_name.lower() in {"commander", "edh"} else 4


async def _fetch_deck_row(session: AsyncSession, deck_id: UUID) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT d.*,
                       pp.handle AS owner_handle,
                       pp.display_name AS owner_name,
                       pp.avatar_url AS owner_avatar
                FROM tcg_judge.decks d
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = d.owner_id
                WHERE d.id = :id
                """
            ),
            {"id": deck_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Deck não encontrado")
    return dict(row)


async def _fetch_deck_cards(session: AsyncSession, deck_id: UUID) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT dc.id, dc.deck_id, dc.card_id, dc.quantity, dc.zone::text AS zone,
                       dc.is_foil,
                       cc.game_code, cc.external_id, cc.name, cc.normalized_name,
                       cc.set_code, cc.set_name, cc.card_number, cc.rarity,
                       cc.image_url, cc.image_uris, cc.game_data, cc.language,
                       cc.source, cc.version, cc.is_reprint,
                       (
                         SELECT price_cents FROM tcg_judge.card_prices cp
                         WHERE cp.card_id = cc.id
                         ORDER BY cp.price_cents ASC NULLS LAST
                         LIMIT 1
                       ) AS lowest_price_cents
                FROM tcg_judge.deck_cards dc
                JOIN tcg_judge.card_catalog cc ON cc.id = dc.card_id
                WHERE dc.deck_id = :did
                ORDER BY cc.name ASC
                """
            ),
            {"did": deck_id},
        )
    ).mappings().all()

    items: list[dict[str, Any]] = []
    for row in rows:
        card_row = dict(row)
        lowest = card_row.pop("lowest_price_cents", None)
        card_payload = _card_payload(
            {
                "id": card_row["card_id"],
                "game_code": card_row.pop("game_code"),
                "external_id": card_row.pop("external_id"),
                "name": card_row.pop("name"),
                "normalized_name": card_row.pop("normalized_name"),
                "set_code": card_row.pop("set_code"),
                "set_name": card_row.pop("set_name"),
                "card_number": card_row.pop("card_number"),
                "rarity": card_row.pop("rarity"),
                "image_url": card_row.pop("image_url"),
                "image_uris": card_row.pop("image_uris"),
                "game_data": card_row.pop("game_data"),
                "language": card_row.pop("language"),
                "source": card_row.pop("source"),
                "version": card_row.pop("version"),
                "is_reprint": card_row.pop("is_reprint"),
                "lowest_price_cents": lowest,
            }
        )
        items.append(
            {
                "id": str(card_row["id"]),
                "card_id": str(card_row["card_id"]),
                "quantity": int(card_row["quantity"]),
                "zone": str(card_row["zone"]),
                "is_foil": bool(card_row["is_foil"]),
                "card": card_payload,
            }
        )
    return items


def _group_cards(cards: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {
        "main_deck": [],
        "sideboard": [],
        "commander": [],
        "companion": [],
    }
    zone_map = {
        "main": "main_deck",
        "sideboard": "sideboard",
        "commander": "commander",
        "companion": "companion",
    }
    for item in cards:
        key = zone_map.get(item["zone"], "main_deck")
        grouped[key].append(item)
    return grouped


def normalize_deck(row: dict[str, Any], cards: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    grouped = _group_cards(cards or [])
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "description": row.get("description"),
        "game": row["game"],
        "format": row["format"],
        "owner_id": row["owner_id"],
        "is_public": bool(row.get("is_public")),
        "total_cards": int(row.get("total_cards") or 0),
        "total_price": int(row.get("total_price") or 0),
        "likes": int(row.get("likes") or 0),
        "views": int(row.get("views") or 0),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
        "owner": {
            "username": row.get("owner_handle"),
            "display_name": row.get("owner_name"),
            "avatar_url": row.get("owner_avatar"),
        }
        if row.get("owner_handle") or row.get("owner_name")
        else None,
        **grouped,
    }


async def update_deck_stats(session: AsyncSession, deck_id: UUID) -> None:
    stats = (
        await session.execute(
            text(
                """
                SELECT COALESCE(SUM(dc.quantity), 0) AS total_cards,
                       COALESCE(SUM(
                         dc.quantity * COALESCE((
                           SELECT MIN(cp.price_cents)
                           FROM tcg_judge.card_prices cp
                           WHERE cp.card_id = dc.card_id
                         ), 0)
                       ), 0) AS total_price
                FROM tcg_judge.deck_cards dc
                WHERE dc.deck_id = :did
                """
            ),
            {"did": deck_id},
        )
    ).mappings().first()
    await session.execute(
        text(
            """
            UPDATE tcg_judge.decks
            SET total_cards = :cards, total_price = :price, updated_at = NOW()
            WHERE id = :id
            """
        ),
        {
            "id": deck_id,
            "cards": int(stats["total_cards"]) if stats else 0,
            "price": int(stats["total_price"]) if stats else 0,
        },
    )


async def create_deck(
    session: AsyncSession,
    owner_id: str,
    *,
    name: str,
    game: str,
    format: str = "standard",
    description: str | None = None,
    is_public: bool = False,
) -> dict[str, Any]:
    await ensure_player_profile(session, owner_id)
    name = name.strip()
    if not name:
        raise HTTPException(400, "Nome do deck obrigatório")

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.decks (name, description, game, format, owner_id, is_public)
                VALUES (:name, :desc, :game, :fmt, :owner, :pub)
                RETURNING id
                """
            ),
            {
                "name": name[:255],
                "desc": description,
                "game": game.lower()[:50],
                "fmt": format.lower()[:50],
                "owner": owner_id,
                "pub": is_public,
            },
        )
    ).mappings().first()
    deck_id = _parse_uuid(str(row["id"]))
    await session.commit()
    await award_xp(session, owner_id, "create_deck", f"Deck criado: {name}")
    await session.commit()
    return await get_deck(session, str(deck_id), viewer_id=owner_id)


async def list_my_decks(session: AsyncSession, owner_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT d.*, pp.handle AS owner_handle, pp.display_name AS owner_name,
                       pp.avatar_url AS owner_avatar
                FROM tcg_judge.decks d
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = d.owner_id
                WHERE d.owner_id = :owner
                ORDER BY d.updated_at DESC
                """
            ),
            {"owner": owner_id},
        )
    ).mappings().all()
    return [normalize_deck(dict(r)) for r in rows]


async def list_public_decks(
    session: AsyncSession,
    *,
    game: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    limit = max(1, min(limit, 100))
    clauses = ["d.is_public = TRUE"]
    params: dict[str, Any] = {"lim": limit}
    if game:
        clauses.append("LOWER(d.game) = LOWER(:game)")
        params["game"] = game
    rows = (
        await session.execute(
            text(
                f"""
                SELECT d.*, pp.handle AS owner_handle, pp.display_name AS owner_name,
                       pp.avatar_url AS owner_avatar
                FROM tcg_judge.decks d
                LEFT JOIN tcg_judge.player_profiles pp ON pp.id = d.owner_id
                WHERE {' AND '.join(clauses)}
                ORDER BY d.likes DESC, d.updated_at DESC
                LIMIT :lim
                """
            ),
            params,
        )
    ).mappings().all()
    return [normalize_deck(dict(r)) for r in rows]


async def get_deck(
    session: AsyncSession,
    deck_id: str,
    *,
    viewer_id: str | None = None,
) -> dict[str, Any]:
    uid = _parse_uuid(deck_id, field="deck_id")
    row = await _fetch_deck_row(session, uid)
    if not row.get("is_public") and viewer_id != row["owner_id"]:
        raise HTTPException(403, "Deck privado")

    if row.get("is_public") and viewer_id and viewer_id != row["owner_id"]:
        await session.execute(
            text("UPDATE tcg_judge.decks SET views = views + 1 WHERE id = :id"),
            {"id": uid},
        )
        await session.commit()
        row["views"] = int(row.get("views") or 0) + 1

    cards = await _fetch_deck_cards(session, uid)
    return normalize_deck(row, cards)


async def update_deck(
    session: AsyncSession,
    owner_id: str,
    deck_id: str,
    *,
    name: str | None = None,
    description: str | None = None,
    format: str | None = None,
    is_public: bool | None = None,
) -> dict[str, Any]:
    uid = _parse_uuid(deck_id, field="deck_id")
    row = await _fetch_deck_row(session, uid)
    if row["owner_id"] != owner_id:
        raise HTTPException(403, "Não autorizado")

    updates: dict[str, Any] = {}
    if name is not None:
        updates["name"] = name.strip()[:255]
    if description is not None:
        updates["description"] = description
    if format is not None:
        updates["format"] = format.lower()[:50]
    if is_public is not None:
        updates["is_public"] = is_public
    if not updates:
        return await get_deck(session, deck_id, viewer_id=owner_id)

    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    await session.execute(
        text(f"UPDATE tcg_judge.decks SET {set_clause}, updated_at = NOW() WHERE id = :id"),
        {**updates, "id": uid},
    )
    await session.commit()
    return await get_deck(session, deck_id, viewer_id=owner_id)


async def delete_deck(session: AsyncSession, owner_id: str, deck_id: str) -> dict[str, bool]:
    uid = _parse_uuid(deck_id, field="deck_id")
    row = await _fetch_deck_row(session, uid)
    if row["owner_id"] != owner_id:
        raise HTTPException(403, "Não autorizado")
    await session.execute(text("DELETE FROM tcg_judge.decks WHERE id = :id"), {"id": uid})
    await session.commit()
    return {"success": True}


async def add_card_to_deck(
    session: AsyncSession,
    owner_id: str,
    deck_id: str,
    *,
    card_id: str,
    quantity: int = 1,
    zone: str = "main",
    is_foil: bool = False,
) -> dict[str, Any]:
    if zone not in VALID_ZONES:
        raise HTTPException(400, "Zona inválida")
    if quantity < 1:
        raise HTTPException(400, "Quantidade inválida")

    uid = _parse_uuid(deck_id, field="deck_id")
    card_uuid = _parse_uuid(card_id, field="card_id")
    deck = await _fetch_deck_row(session, uid)
    if deck["owner_id"] != owner_id:
        raise HTTPException(403, "Não autorizado")

    card_exists = (
        await session.execute(
            text("SELECT 1 FROM tcg_judge.card_catalog WHERE id = :id"),
            {"id": card_uuid},
        )
    ).first()
    if not card_exists:
        raise HTTPException(404, "Carta não encontrada")

    existing = (
        await session.execute(
            text(
                """
                SELECT id, quantity FROM tcg_judge.deck_cards
                WHERE deck_id = :did AND card_id = :cid AND zone = :zone::tcg_judge.deck_zone
                  AND is_foil = :foil
                """
            ),
            {"did": uid, "cid": card_uuid, "zone": zone, "foil": is_foil},
        )
    ).mappings().first()

    max_copies = _max_copies(str(deck["format"]))
    total_same_card = (
        await session.execute(
            text(
                """
                SELECT COALESCE(SUM(quantity), 0) AS qty
                FROM tcg_judge.deck_cards
                WHERE deck_id = :did AND card_id = :cid AND zone = :zone::tcg_judge.deck_zone
                """
            ),
            {"did": uid, "cid": card_uuid, "zone": zone},
        )
    ).mappings().first()
    current_qty = int(total_same_card["qty"]) if total_same_card else 0
    if current_qty + quantity > max_copies:
        raise HTTPException(400, f"Máximo de {max_copies} cópias permitidas")

    if existing:
        await session.execute(
            text("UPDATE tcg_judge.deck_cards SET quantity = quantity + :qty WHERE id = :id"),
            {"qty": quantity, "id": existing["id"]},
        )
    else:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.deck_cards (deck_id, card_id, quantity, zone, is_foil)
                VALUES (:did, :cid, :qty, :zone::tcg_judge.deck_zone, :foil)
                """
            ),
            {"did": uid, "cid": card_uuid, "qty": quantity, "zone": zone, "foil": is_foil},
        )

    await update_deck_stats(session, uid)
    await session.commit()
    return await get_deck(session, deck_id, viewer_id=owner_id)


async def update_deck_card_quantity(
    session: AsyncSession,
    owner_id: str,
    deck_id: str,
    deck_card_id: str,
    *,
    quantity: int,
) -> dict[str, Any]:
    if quantity < 1:
        raise HTTPException(400, "Quantidade inválida")
    uid = _parse_uuid(deck_id, field="deck_id")
    dcid = _parse_uuid(deck_card_id, field="deck_card_id")
    deck = await _fetch_deck_row(session, uid)
    if deck["owner_id"] != owner_id:
        raise HTTPException(403, "Não autorizado")

    row = (
        await session.execute(
            text(
                """
                SELECT card_id, zone::text AS zone FROM tcg_judge.deck_cards
                WHERE id = :dcid AND deck_id = :did
                """
            ),
            {"dcid": dcid, "did": uid},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Carta do deck não encontrada")

    max_copies = _max_copies(str(deck["format"]))
    if quantity > max_copies:
        raise HTTPException(400, f"Máximo de {max_copies} cópias permitidas")

    await session.execute(
        text("UPDATE tcg_judge.deck_cards SET quantity = :qty WHERE id = :id"),
        {"qty": quantity, "id": dcid},
    )
    await update_deck_stats(session, uid)
    await session.commit()
    return await get_deck(session, deck_id, viewer_id=owner_id)


async def remove_card_from_deck(
    session: AsyncSession,
    owner_id: str,
    deck_id: str,
    deck_card_id: str,
) -> dict[str, Any]:
    uid = _parse_uuid(deck_id, field="deck_id")
    dcid = _parse_uuid(deck_card_id, field="deck_card_id")
    deck = await _fetch_deck_row(session, uid)
    if deck["owner_id"] != owner_id:
        raise HTTPException(403, "Não autorizado")

    result = await session.execute(
        text("DELETE FROM tcg_judge.deck_cards WHERE id = :id AND deck_id = :did"),
        {"id": dcid, "did": uid},
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Carta do deck não encontrada")

    await update_deck_stats(session, uid)
    await session.commit()
    return await get_deck(session, deck_id, viewer_id=owner_id)


async def publish_deck(session: AsyncSession, owner_id: str, deck_id: str) -> dict[str, Any]:
    uid = _parse_uuid(deck_id, field="deck_id")
    deck = await _fetch_deck_row(session, uid)
    if deck["owner_id"] != owner_id:
        raise HTTPException(403, "Não autorizado")

    await session.execute(
        text("UPDATE tcg_judge.decks SET is_public = TRUE, updated_at = NOW() WHERE id = :id"),
        {"id": uid},
    )
    await session.commit()
    await award_xp(session, owner_id, "publish_deck", f"Deck publicado: {deck['name']}")
    await session.commit()
    return await get_deck(session, deck_id, viewer_id=owner_id)


async def export_deck(
    session: AsyncSession,
    deck_id: str,
    *,
    export_format: str = "text",
    viewer_id: str | None = None,
) -> dict[str, str]:
    deck = await get_deck(session, deck_id, viewer_id=viewer_id)
    cards = deck.get("main_deck", []) + deck.get("sideboard", [])
    if export_format == "dec":
        lines = [f"{c['quantity']} {c['card']['name']}" for c in deck.get("main_deck", [])]
        if deck.get("sideboard"):
            lines.append("Sideboard")
            lines.extend(f"{c['quantity']} {c['card']['name']}" for c in deck["sideboard"])
        return {"content": "\n".join(lines), "format": "dec"}
    if export_format == "arena":
        lines = []
        for c in deck.get("main_deck", []):
            card = c["card"]
            set_code = card.get("set", {}).get("code", "")
            num = card.get("number", "")
            lines.append(f"{c['quantity']} {card['name']} ({set_code}) {num}")
        for c in deck.get("sideboard", []):
            card = c["card"]
            set_code = card.get("set", {}).get("code", "")
            num = card.get("number", "")
            lines.append(f"Sideboard: {c['quantity']} {card['name']} ({set_code}) {num}")
        return {"content": "\n".join(lines), "format": "arena"}
    lines = [f"{c['quantity']}x {c['card']['name']}" for c in deck.get("main_deck", [])]
    if deck.get("sideboard"):
        lines.append("\nSideboard:")
        lines.extend(f"{c['quantity']}x {c['card']['name']}" for c in deck["sideboard"])
    return {"content": "\n".join(lines), "format": "text"}
