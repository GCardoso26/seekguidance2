"""CRUD de listagens de cartas do catálogo (Fase 1.6)."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.image_utils import normalize_tcgdex_image_url
from app.marketplace.shop_store import store_is_sellable

VALID_CONDITIONS = frozenset({"NM", "LP", "MP", "HP", "DM"})
LISTING_STATUSES = frozenset({"active", "sold", "reserved", "inactive"})


def _parse_uuid(value: str, *, field: str = "id") -> UUID:
    try:
        return UUID(str(value))
    except ValueError as exc:
        raise HTTPException(400, f"{field} inválido") from exc


async def _seller_store(session: AsyncSession, seller_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.stores
                WHERE owner_id = :oid
                ORDER BY shop_enabled DESC, created_at ASC
                LIMIT 1
                """
            ),
            {"oid": seller_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Cadastre uma loja antes de listar cartas")
    store = dict(row)
    if not store_is_sellable(store):
        raise HTTPException(400, "Configure PIX ou Stripe na sua loja antes de vender")
    return store


async def _get_card(session: AsyncSession, card_id: UUID) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT id, name, game_code, set_name, image_url, image_uris, language
                FROM tcg_judge.card_catalog
                WHERE id = :id
                """
            ),
            {"id": card_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Carta não encontrada no catálogo")
    return dict(row)


def _listing_payload(row: dict[str, Any]) -> dict[str, Any]:
    images = row.get("images") or []
    image_list = [str(i) for i in images if i]
    card_images = row.get("card_image_uris") or {}
    if isinstance(card_images, str):
        card_images = {}
    if not image_list and isinstance(card_images, dict):
        image_list = [
            normalize_tcgdex_image_url(u)
            for u in (
                card_images.get("normal"),
                card_images.get("large"),
                row.get("card_image_url"),
            )
            if u
        ]

    reputation_raw = row.get("seller_trust_score") or row.get("seller_reputation") or row.get("average_rating")
    review_count = int(row.get("store_review_count") or row.get("review_count") or 0)
    if row.get("seller_trust_score") is not None:
        reputation = float(row["seller_trust_score"]) / 20.0
    elif reputation_raw is not None and review_count > 0:
        reputation = float(reputation_raw)
    else:
        reputation = 0.0
    product_id = row.get("store_product_id")
    qty = int(row.get("quantity") or 0)
    status = str(row.get("status") or "active")

    return {
        "id": str(row["id"]),
        "cardId": str(row["card_id"]),
        "sellerId": str(row["seller_id"]),
        "sellerName": str(row.get("seller_name") or row.get("store_name") or "Vendedor"),
        "sellerReputation": round(reputation, 1),
        "sellerReviewCount": review_count,
        "storeVerificationStatus": row.get("store_verification_status") or row.get("verification_status"),
        "storeAcceptsPix": bool(row.get("store_accepts_pix")),
        "storeAcceptsCard": bool(row.get("store_accepts_card")),
        "storeSlug": row.get("store_slug"),
        "sellerAvatar": row.get("seller_avatar") or row.get("store_logo"),
        "condition": str(row["condition"]),
        "price": round(int(row["price_cents"]) / 100, 2),
        "currency": str(row.get("currency") or "BRL"),
        "quantity": qty,
        "foil": bool(row.get("foil")),
        "language": str(row.get("language") or "pt"),
        "description": row.get("description"),
        "images": image_list,
        "createdAt": str(row.get("created_at") or ""),
        "status": status,
        "productId": str(product_id) if product_id else None,
        "storeId": str(row.get("store_id") or ""),
        "cardName": row.get("card_name"),
        "setName": row.get("set_name"),
        # Buyer read-model fields (derived from listing row — no Inventory BC query)
        "availability": "in_stock" if status == "active" and qty > 0 else "out_of_stock",
        "updatedAt": str(row.get("updated_at") or row.get("created_at") or ""),
    }


async def create_listing(
    session: AsyncSession,
    seller_id: str,
    *,
    card_id: str,
    condition: str,
    price_cents: int,
    quantity: int = 1,
    foil: bool = False,
    language: str = "pt",
    description: str | None = None,
    images: list[str] | None = None,
) -> dict[str, Any]:
    from app.kyc.merchant_kyc import require_verified_merchant

    if condition.upper() not in VALID_CONDITIONS:
        raise HTTPException(400, "Condição inválida")
    if price_cents <= 0:
        raise HTTPException(400, "Preço inválido")
    if quantity < 1:
        raise HTTPException(400, "Quantidade inválida")

    card_uuid = _parse_uuid(card_id, field="card_id")
    await require_verified_merchant(session, seller_id)
    card = await _get_card(session, card_uuid)
    store = await _seller_store(session, seller_id)
    store_id = str(store["id"])
    cond = condition.upper()
    lang = (language or str(card.get("language") or "pt")).lower()[:10]

    image_uris = card.get("image_uris") or {}
    product_images = images or []
    if not product_images:
        normal = image_uris.get("normal") if isinstance(image_uris, dict) else None
        if normal:
            product_images = [normal]
        elif card.get("image_url"):
            product_images = [str(card["image_url"])]

    product_name = f"{card['name']} ({cond}{' Foil' if foil else ''})"

    existing = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.card_listings
                WHERE card_id = :cid AND seller_id = :sid
                  AND condition = :cond AND foil = :foil AND language = :lang
                """
            ),
            {
                "cid": card_uuid,
                "sid": seller_id,
                "cond": cond,
                "foil": foil,
                "lang": lang,
            },
        )
    ).mappings().first()

    if existing:
        listing_id = existing["id"]
        product_id = existing.get("store_product_id")
        new_qty = int(existing["quantity"]) + quantity
        if product_id:
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.store_products
                    SET price_cents = :price, stock = :stock, updated_at = NOW()
                    WHERE id = :pid
                    """
                ),
                {"price": price_cents, "stock": new_qty, "pid": product_id},
            )
        await session.execute(
            text(
                """
                UPDATE tcg_judge.card_listings
                SET price_cents = :price, quantity = :qty, description = COALESCE(:desc, description),
                    status = 'active', updated_at = NOW()
                WHERE id = :id
                """
            ),
            {
                "price": price_cents,
                "qty": new_qty,
                "desc": description,
                "id": listing_id,
            },
        )
    else:
        product_row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.store_products (
                      store_id, name, description, tcg_id, category,
                      price_cents, stock, images, catalog_card_id, is_active
                    ) VALUES (
                      :sid, :name, :desc, :tcg, 'single',
                      :price, :stock, :images, :cid, true
                    )
                    RETURNING id
                    """
                ),
                {
                    "sid": store_id,
                    "name": product_name[:200],
                    "desc": description or f"Carta avulsa — {card.get('set_name') or ''}".strip(),
                    "tcg": str(card.get("game_code") or "MTG"),
                    "price": price_cents,
                    "stock": quantity,
                    "images": product_images,
                    "cid": card_uuid,
                },
            )
        ).mappings().first()
        product_id = product_row["id"] if product_row else None

        listing_row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.card_listings (
                      card_id, seller_id, store_id, store_product_id,
                      condition, price_cents, currency, quantity, foil, language,
                      images, description, status
                    ) VALUES (
                      :cid, :sid, :store_id, :pid,
                      :cond, :price, 'BRL', :qty, :foil, :lang,
                      :images, :desc, 'active'
                    )
                    RETURNING id
                    """
                ),
                {
                    "cid": card_uuid,
                    "sid": seller_id,
                    "store_id": store_id,
                    "pid": product_id,
                    "cond": cond,
                    "price": price_cents,
                    "qty": quantity,
                    "foil": foil,
                    "lang": lang,
                    "images": product_images,
                    "desc": description,
                },
            )
        ).mappings().first()
        listing_id = listing_row["id"] if listing_row else None

    from app.gamification.xp import award_xp

    await award_xp(session, seller_id, "list_card", f"Listagem: {card['name']}")

    try:
        from app.judge.analytics_events import record_marketplace_event

        await record_marketplace_event(
            session,
            "listing_create",
            user_id=seller_id,
            properties={"card_id": str(card_uuid), "card_name": card["name"]},
        )
    except Exception:
        pass

    if listing_id and store_id:
        try:
            from app.analytics.event_bridge import enqueue_analytics_rebuild

            await enqueue_analytics_rebuild(
                session,
                store_id=str(store_id),
                event_type="ListingPublished",
                source_id=str(listing_id),
            )
        except Exception:
            pass

    await session.commit()
    return await get_listing_by_id(session, str(listing_id))


async def get_listing_by_id(session: AsyncSession, listing_id: str) -> dict[str, Any]:
    uid = _parse_uuid(listing_id)
    row = (
        await session.execute(
            text(
                """
                SELECT cl.*,
                       pp.display_name AS seller_name,
                       pp.avatar_url AS seller_avatar,
                       s.name AS store_name,
                       s.logo_url AS store_logo,
                       COALESCE(rp.trust_score, 75) AS seller_trust_score,
                       s.average_rating AS seller_reputation,
                       cc.name AS card_name,
                       cc.set_name,
                       cc.image_url AS card_image_url,
                       cc.image_uris AS card_image_uris
                FROM tcg_judge.card_listings cl
                JOIN tcg_judge.player_profiles pp ON pp.id = cl.seller_id
                JOIN tcg_judge.stores s ON s.id = cl.store_id
                LEFT JOIN tcg_judge.store_reputation_projection rp ON rp.store_id = s.id
                JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
                WHERE cl.id = :id
                """
            ),
            {"id": uid},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Listagem não encontrada")
    return _listing_payload(dict(row))


async def list_listings_by_card(
    session: AsyncSession,
    card_id: str,
    *,
    condition: str | None = None,
    foil: bool | None = None,
) -> list[dict[str, Any]]:
    try:
        uid = _parse_uuid(card_id, field="card_id")
    except HTTPException:
        return []

    clauses = [
        "cl.card_id = :cid",
        "cl.status = 'active'",
        "cl.quantity > 0",
        "s.shop_enabled = true",
    ]
    params: dict[str, Any] = {"cid": uid}

    if condition and condition.upper() in VALID_CONDITIONS:
        clauses.append("cl.condition = :cond")
        params["cond"] = condition.upper()
    if foil is not None:
        clauses.append("cl.foil = :foil")
        params["foil"] = foil

    sql = f"""
        SELECT cl.*,
               pp.display_name AS seller_name,
               pp.avatar_url AS seller_avatar,
               s.name AS store_name,
               s.slug AS store_slug,
               s.logo_url AS store_logo,
               s.average_rating AS seller_reputation,
               s.review_count AS store_review_count,
               s.verification_status AS store_verification_status,
               (COALESCE(s.pix_key, '') <> '') AS store_accepts_pix,
               (s.stripe_account_id IS NOT NULL AND s.stripe_onboarding_complete = true) AS store_accepts_card,
               cc.name AS card_name,
               cc.set_name,
               cc.image_url AS card_image_url,
               cc.image_uris AS card_image_uris
        FROM tcg_judge.card_listings cl
        JOIN tcg_judge.player_profiles pp ON pp.id = cl.seller_id
        JOIN tcg_judge.stores s ON s.id = cl.store_id
        JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
        WHERE {' AND '.join(clauses)}
        ORDER BY cl.price_cents ASC, cl.created_at DESC
        LIMIT 50
    """
    rows = (await session.execute(text(sql), params)).mappings().all()
    return [_listing_payload(dict(r)) for r in rows]


async def list_my_listings(
    session: AsyncSession,
    seller_id: str,
    *,
    status: str | None = None,
) -> list[dict[str, Any]]:
    clauses = ["cl.seller_id = :sid"]
    params: dict[str, Any] = {"sid": seller_id}
    if status:
        if status not in LISTING_STATUSES:
            raise HTTPException(400, "Status inválido")
        clauses.append("cl.status = :status")
        params["status"] = status

    sql = f"""
        SELECT cl.*,
               pp.display_name AS seller_name,
               pp.avatar_url AS seller_avatar,
               s.name AS store_name,
               s.slug AS store_slug,
               s.logo_url AS store_logo,
               s.average_rating AS seller_reputation,
               s.review_count AS store_review_count,
               s.verification_status AS store_verification_status,
               (COALESCE(s.pix_key, '') <> '') AS store_accepts_pix,
               (s.stripe_account_id IS NOT NULL AND s.stripe_onboarding_complete = true) AS store_accepts_card,
               cc.name AS card_name,
               cc.set_name,
               cc.image_url AS card_image_url,
               cc.image_uris AS card_image_uris
        FROM tcg_judge.card_listings cl
        JOIN tcg_judge.player_profiles pp ON pp.id = cl.seller_id
        JOIN tcg_judge.stores s ON s.id = cl.store_id
        JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
        WHERE {' AND '.join(clauses)}
        ORDER BY cl.updated_at DESC
        LIMIT 100
    """
    rows = (await session.execute(text(sql), params)).mappings().all()
    return [_listing_payload(dict(r)) for r in rows]


async def update_listing(
    session: AsyncSession,
    listing_id: str,
    seller_id: str,
    fields: dict[str, Any],
) -> dict[str, Any]:
    uid = _parse_uuid(listing_id)
    row = (
        await session.execute(
            text(
                "SELECT seller_id, store_product_id, quantity FROM tcg_judge.card_listings WHERE id = :id"
            ),
            {"id": uid},
        )
    ).mappings().first()
    if not row or row["seller_id"] != seller_id:
        raise HTTPException(403, "Não autorizado")

    allowed = {"price_cents", "quantity", "status", "description", "language", "condition"}
    updates: dict[str, Any] = {}
    for key, value in fields.items():
        if key not in allowed or value is None:
            continue
        if key == "status" and value not in LISTING_STATUSES:
            raise HTTPException(400, "Status inválido")
        if key == "price_cents" and int(value) <= 0:
            raise HTTPException(400, "Preço inválido")
        if key == "quantity" and int(value) < 0:
            raise HTTPException(400, "Quantidade inválida")
        if key == "language":
            updates[key] = str(value).strip().lower()[:10]
            continue
        if key == "condition":
            updates[key] = str(value).strip().upper()[:10]
            continue
        updates[key] = value

    if not updates:
        raise HTTPException(400, "Nada para atualizar")

    set_parts = [f"{k} = :{k}" for k in updates]
    updates["id"] = uid
    try:
        await session.execute(
            text(f"UPDATE tcg_judge.card_listings SET {', '.join(set_parts)}, updated_at = NOW() WHERE id = :id"),
            updates,
        )
    except Exception as exc:  # noqa: BLE001 — detectar UNIQUE de language/condition
        msg = str(exc).lower()
        if "unique" in msg or "card_listings_unique" in msg:
            raise HTTPException(
                409,
                "Já existe listagem com este idioma/condição para a mesma carta.",
            ) from exc
        raise

    product_id = row.get("store_product_id")
    if product_id:
        prod_updates: dict[str, Any] = {"pid": product_id}
        prod_sets: list[str] = []
        if "price_cents" in updates:
            prod_sets.append("price_cents = :price")
            prod_updates["price"] = updates["price_cents"]
        if "quantity" in updates:
            prod_sets.append("stock = :stock")
            prod_updates["stock"] = updates["quantity"]
        if "status" in updates and updates["status"] != "active":
            prod_sets.append("is_active = false")
        elif "status" in updates and updates["status"] == "active":
            prod_sets.append("is_active = true")
        if prod_sets:
            await session.execute(
                text(
                    f"UPDATE tcg_judge.store_products SET {', '.join(prod_sets)}, updated_at = NOW() WHERE id = :pid"
                ),
                prod_updates,
            )

    await session.commit()
    return await get_listing_by_id(session, listing_id)


async def delete_listing(session: AsyncSession, listing_id: str, seller_id: str) -> dict[str, bool]:
    uid = _parse_uuid(listing_id)
    row = (
        await session.execute(
            text("SELECT seller_id, store_product_id FROM tcg_judge.card_listings WHERE id = :id"),
            {"id": uid},
        )
    ).mappings().first()
    if not row or row["seller_id"] != seller_id:
        raise HTTPException(403, "Não autorizado")

    await session.execute(
        text("UPDATE tcg_judge.card_listings SET status = 'inactive', updated_at = NOW() WHERE id = :id"),
        {"id": uid},
    )
    if row.get("store_product_id"):
        await session.execute(
            text("UPDATE tcg_judge.store_products SET is_active = false, updated_at = NOW() WHERE id = :pid"),
            {"pid": row["store_product_id"]},
        )
    await session.commit()
    return {"success": True}
