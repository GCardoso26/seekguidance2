"""Wishlist Application Service — Sprint 15.

CRUD de listas e itens. Nunca acessa Catalog BC — apenas store_products.
"""

from __future__ import annotations

import json
import uuid
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.wishlist_aggregate import (
    can_remove_list,
    ensure_default_lists_payload,
    item_snapshot_from_product,
    merge_list_names,
    new_share_token,
    reorder_items,
    slugify_name,
    validate_list_name,
    validate_slug,
)
from app.platform.jobs import emit_outbox_event

STORE_SELLABLE_SQL = """
  s.shop_enabled = true
  AND (s.pix_key IS NOT NULL OR (s.stripe_account_id IS NOT NULL AND s.stripe_onboarding_complete = true))
"""


async def _ensure_lists(session: AsyncSession, user_id: str) -> None:
    row = (
        await session.execute(
            text("SELECT COUNT(*)::int AS c FROM tcg_judge.wishlist_lists WHERE user_id = :uid"),
            {"uid": user_id},
        )
    ).mappings().first()
    if int(row["c"] if row else 0) > 0:
        return
    for payload in ensure_default_lists_payload(user_id):
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.wishlist_lists
                  (user_id, name, slug, is_default, sort_order)
                VALUES (:user_id, :name, :slug, :is_default, :sort_order)
                """
            ),
            payload,
        )
    await session.commit()


async def list_wishlists(session: AsyncSession, user_id: str) -> dict[str, Any]:
    await _ensure_lists(session, user_id)
    rows = (
        await session.execute(
            text(
                """
                SELECT wl.*,
                  (SELECT COUNT(*)::int FROM tcg_judge.wishlist_items wi WHERE wi.list_id = wl.id) AS item_count
                FROM tcg_judge.wishlist_lists wl
                WHERE wl.user_id = :uid
                ORDER BY wl.sort_order ASC, wl.created_at ASC
                """
            ),
            {"uid": user_id},
        )
    ).mappings().all()
    return {"lists": [dict(r) for r in rows], "total": len(rows)}


async def get_wishlist(session: AsyncSession, user_id: str, list_id: str) -> dict[str, Any]:
    await _ensure_lists(session, user_id)
    lst = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.wishlist_lists
                WHERE id = CAST(:id AS uuid) AND user_id = :uid
                """
            ),
            {"id": list_id, "uid": user_id},
        )
    ).mappings().first()
    if not lst:
        raise HTTPException(404, "Lista não encontrada")
    items = (
        await session.execute(
            text(
                """
                SELECT wi.*, sp.name AS product_name, sp.price_cents, sp.images
                FROM tcg_judge.wishlist_items wi
                LEFT JOIN tcg_judge.store_products sp ON sp.id = wi.product_id
                WHERE wi.list_id = CAST(:lid AS uuid)
                ORDER BY wi.sort_order ASC, wi.created_at DESC
                """
            ),
            {"lid": list_id},
        )
    ).mappings().all()
    payload_items = []
    for row in items:
        snap = row.get("product_snapshot") or {}
        if isinstance(snap, str):
            snap = json.loads(snap)
        payload_items.append(
            {
                "id": str(row["id"]),
                "product_id": str(row["product_id"]),
                "product": snap or {
                    "id": str(row["product_id"]),
                    "name": row.get("product_name"),
                    "price_cents": row.get("price_cents"),
                    "images": row.get("images") or [],
                },
                "sort_order": row.get("sort_order"),
                "added_at": row.get("created_at"),
            }
        )
    return {"list": dict(lst), "items": payload_items, "total": len(payload_items)}


async def create_wishlist(session: AsyncSession, user_id: str, *, name: str) -> dict[str, Any]:
    await _ensure_lists(session, user_id)
    clean = validate_list_name(name)
    slug = slugify_name(clean)
    existing = (
        await session.execute(
            text(
                """
                SELECT id FROM tcg_judge.wishlist_lists
                WHERE user_id = :uid AND slug = :slug
                """
            ),
            {"uid": user_id, "slug": slug},
        )
    ).mappings().first()
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.wishlist_lists (user_id, name, slug, sort_order)
                VALUES (:uid, :name, :slug,
                  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tcg_judge.wishlist_lists WHERE user_id = :uid))
                RETURNING *
                """
            ),
            {"uid": user_id, "name": clean, "slug": slug},
        )
    ).mappings().first()
    await session.commit()
    await emit_outbox_event(
        session,
        event_type="WishlistCreated",
        aggregate_type="WishlistList",
        aggregate_id=str(row["id"]),
        payload={"user_id": user_id, "name": clean},
        correlation_id=str(uuid.uuid4()),
    )
    await session.commit()
    return dict(row)


async def rename_wishlist(
    session: AsyncSession, user_id: str, list_id: str, *, name: str
) -> dict[str, Any]:
    clean = validate_list_name(name)
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.wishlist_lists
                SET name = :name, updated_at = NOW()
                WHERE id = CAST(:id AS uuid) AND user_id = :uid
                RETURNING *
                """
            ),
            {"name": clean, "id": list_id, "uid": user_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Lista não encontrada")
    await session.commit()
    return dict(row)


async def delete_wishlist(session: AsyncSession, user_id: str, list_id: str) -> None:
    row = (
        await session.execute(
            text(
                """
                SELECT wl.*,
                  (SELECT COUNT(*)::int FROM tcg_judge.wishlist_items wi WHERE wi.list_id = wl.id) AS item_count
                FROM tcg_judge.wishlist_lists wl
                WHERE wl.id = CAST(:id AS uuid) AND wl.user_id = :uid
                """
            ),
            {"id": list_id, "uid": user_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Lista não encontrada")
    can_remove_list(is_default=bool(row["is_default"]), item_count=int(row["item_count"]))
    await session.execute(
        text("DELETE FROM tcg_judge.wishlist_lists WHERE id = CAST(:id AS uuid)"),
        {"id": list_id},
    )
    await session.commit()


async def duplicate_wishlist(session: AsyncSession, user_id: str, list_id: str) -> dict[str, Any]:
    source = await get_wishlist(session, user_id, list_id)
    created = await create_wishlist(
        session, user_id, name=f"{source['list']['name']} (cópia)"
    )
    for item in source["items"]:
        await add_item(
            session,
            user_id,
            str(created["id"]),
            product_id=str(item["product_id"]),
            product_snapshot=item.get("product"),
        )
    return await get_wishlist(session, user_id, str(created["id"]))


async def share_wishlist(session: AsyncSession, user_id: str, list_id: str) -> dict[str, Any]:
    token = new_share_token()
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.wishlist_lists
                SET share_token = :token, updated_at = NOW()
                WHERE id = CAST(:id AS uuid) AND user_id = :uid
                RETURNING id, share_token, name
                """
            ),
            {"token": token, "id": list_id, "uid": user_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Lista não encontrada")
    await session.commit()
    await emit_outbox_event(
        session,
        event_type="WishlistShared",
        aggregate_type="WishlistList",
        aggregate_id=str(row["id"]),
        payload={"share_token": token},
        correlation_id=str(uuid.uuid4()),
    )
    await session.commit()
    return {"share_token": row["share_token"], "list_id": str(row["id"]), "name": row["name"]}


async def _resolve_product(
    session: AsyncSession, product_id: str
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                f"""
                SELECT p.*, s.id AS store_id
                FROM tcg_judge.store_products p
                JOIN tcg_judge.stores s ON s.id = p.store_id
                WHERE p.id = CAST(:id AS uuid) AND p.is_active = true AND {STORE_SELLABLE_SQL.strip()}
                """
            ),
            {"id": product_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Produto não encontrado")
    return dict(row)


async def add_item(
    session: AsyncSession,
    user_id: str,
    list_id: str,
    *,
    product_id: str,
    product_snapshot: dict[str, Any] | None = None,
) -> dict[str, Any]:
    await _ensure_lists(session, user_id)
    lst = (
        await session.execute(
            text(
                """
                SELECT id FROM tcg_judge.wishlist_lists
                WHERE id = CAST(:id AS uuid) AND user_id = :uid
                """
            ),
            {"id": list_id, "uid": user_id},
        )
    ).mappings().first()
    if not lst:
        raise HTTPException(404, "Lista não encontrada")

    product = await _resolve_product(session, product_id)
    snap = product_snapshot or item_snapshot_from_product(product)

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.wishlist_items
                  (list_id, user_id, product_id, product_snapshot, sort_order)
                VALUES (
                  CAST(:lid AS uuid), :uid, CAST(:pid AS uuid), CAST(:snap AS jsonb),
                  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tcg_judge.wishlist_items WHERE list_id = CAST(:lid AS uuid))
                )
                ON CONFLICT (list_id, product_id) DO UPDATE
                  SET product_snapshot = EXCLUDED.product_snapshot, sort_order = EXCLUDED.sort_order
                RETURNING *
                """
            ),
            {
                "lid": list_id,
                "uid": user_id,
                "pid": product_id,
                "snap": json.dumps(snap),
            },
        )
    ).mappings().first()
    await session.commit()
    return {
        "id": str(row["id"]),
        "product_id": product_id,
        "product": snap,
        "added_at": row["created_at"],
    }


async def remove_item(
    session: AsyncSession, user_id: str, list_id: str, item_id: str
) -> None:
    result = await session.execute(
        text(
            """
            DELETE FROM tcg_judge.wishlist_items
            WHERE id = CAST(:iid AS uuid)
              AND list_id = CAST(:lid AS uuid)
              AND user_id = :uid
            """
        ),
        {"iid": item_id, "lid": list_id, "uid": user_id},
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Item não encontrado")
    await session.commit()


async def move_items(
    session: AsyncSession,
    user_id: str,
    *,
    from_list_id: str,
    to_list_id: str,
    item_ids: list[str],
    copy: bool = False,
) -> dict[str, Any]:
    if from_list_id == to_list_id:
        raise HTTPException(400, "Listas de origem e destino devem ser diferentes")
    moved = 0
    for item_id in item_ids:
        row = (
            await session.execute(
                text(
                    """
                    SELECT * FROM tcg_judge.wishlist_items
                    WHERE id = CAST(:iid AS uuid) AND user_id = :uid AND list_id = CAST(:from AS uuid)
                    """
                ),
                {"iid": item_id, "uid": user_id, "from": from_list_id},
            )
        ).mappings().first()
        if not row:
            continue
        snap = row.get("product_snapshot")
        if isinstance(snap, str):
            snap = json.loads(snap)
        await add_item(
            session,
            user_id,
            to_list_id,
            product_id=str(row["product_id"]),
            product_snapshot=snap if isinstance(snap, dict) else None,
        )
        if not copy:
            await remove_item(session, user_id, from_list_id, item_id)
        moved += 1
    return {"moved": moved, "copy": copy}


async def merge_lists(
    session: AsyncSession, user_id: str, *, source_id: str, target_id: str
) -> dict[str, Any]:
    source = await get_wishlist(session, user_id, source_id)
    target = await get_wishlist(session, user_id, target_id)
    for item in source["items"]:
        await add_item(
            session,
            user_id,
            target_id,
            product_id=str(item["product_id"]),
            product_snapshot=item.get("product"),
        )
    await session.execute(
        text("DELETE FROM tcg_judge.wishlist_items WHERE list_id = CAST(:lid AS uuid)"),
        {"lid": source_id},
    )
    await session.commit()
    await delete_wishlist(session, user_id, source_id)
    renamed = merge_list_names(str(source["list"]["name"]), str(target["list"]["name"]))
    await rename_wishlist(session, user_id, target_id, name=renamed)
    return await get_wishlist(session, user_id, target_id)


async def reorder_list_items(
    session: AsyncSession, user_id: str, list_id: str, ordered_item_ids: list[str]
) -> dict[str, Any]:
    current = await get_wishlist(session, user_id, list_id)
    ordered = reorder_items(current["items"], ordered_item_ids)
    for row in ordered:
        await session.execute(
            text(
                """
                UPDATE tcg_judge.wishlist_items
                SET sort_order = :ord
                WHERE id = CAST(:id AS uuid) AND user_id = :uid
                """
            ),
            {"ord": row["sort_order"], "id": row["id"], "uid": user_id},
        )
    await session.commit()
    return await get_wishlist(session, user_id, list_id)


# Legacy flat API (BFF /marketplace/wishlist)
async def get_flat_wishlist(session: AsyncSession, user_id: str) -> dict[str, Any]:
    await _ensure_lists(session, user_id)
    default = (
        await session.execute(
            text(
                """
                SELECT id FROM tcg_judge.wishlist_lists
                WHERE user_id = :uid AND is_default = true
                ORDER BY sort_order ASC LIMIT 1
                """
            ),
            {"uid": user_id},
        )
    ).mappings().first()
    if not default:
        return {"items": [], "total": 0}
    data = await get_wishlist(session, user_id, str(default["id"]))
    items = [
        {
            "product_id": i["product_id"],
            "product": i.get("product"),
            "added_at": i.get("added_at"),
        }
        for i in data["items"]
    ]
    return {"items": items, "total": len(items)}


async def add_flat_item(
    session: AsyncSession,
    user_id: str,
    *,
    product_id: str,
    product: dict[str, Any] | None = None,
) -> dict[str, Any]:
    await _ensure_lists(session, user_id)
    default = (
        await session.execute(
            text(
                """
                SELECT id FROM tcg_judge.wishlist_lists
                WHERE user_id = :uid AND is_default = true
                ORDER BY sort_order ASC LIMIT 1
                """
            ),
            {"uid": user_id},
        )
    ).mappings().first()
    if not default:
        raise HTTPException(500, "Lista padrão ausente")
    return await add_item(
        session,
        user_id,
        str(default["id"]),
        product_id=product_id,
        product_snapshot=product,
    )


async def remove_flat_item(session: AsyncSession, user_id: str, product_id: str) -> None:
    result = await session.execute(
        text(
            """
            DELETE FROM tcg_judge.wishlist_items
            WHERE user_id = :uid AND product_id = CAST(:pid AS uuid)
            """
        ),
        {"uid": user_id, "pid": product_id},
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Item não encontrado")
    await session.commit()
