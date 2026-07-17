"""Inventory bulk operations (Application Layer) — consome adjust/listings existentes."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import card_listings as card_listings_svc
from app.marketplace import shop_products as shop_products_svc
from app.marketplace.seller_inventory_search import adjust_inventory

BulkAction = Literal["adjust_set", "adjust_add", "publish", "archive", "delete"]


async def bulk_inventory(
    session: AsyncSession,
    owner_id: str,
    *,
    action: BulkAction,
    items: list[dict[str, Any]],
    quantity: int | None = None,
) -> dict[str, Any]:
    if not items:
        raise HTTPException(400, "Nenhum item selecionado")
    if len(items) > 50:
        raise HTTPException(400, "Máximo 50 itens por lote")

    results: list[dict[str, Any]] = []
    errors: list[str] = []

    for raw in items:
        kind = raw.get("kind") or "products"
        try:
            if action in {"adjust_set", "adjust_add"}:
                mode = "set" if action == "adjust_set" else "add"
                qty = int(quantity if quantity is not None else raw.get("quantity") or 0)
                out = await adjust_inventory(
                    session,
                    owner_id,
                    kind=kind,
                    mode=mode,
                    quantity=qty,
                    listing_id=raw.get("listing_id"),
                    product_id=raw.get("product_id"),
                    card_id=raw.get("card_id"),
                    price_cents=raw.get("price_cents"),
                    title=raw.get("title"),
                    category=raw.get("category"),
                )
                results.append({"id": raw.get("id"), "ok": True, "created": out.get("created")})
            elif action == "publish":
                if kind == "cards" and raw.get("listing_id"):
                    await card_listings_svc.update_listing(
                        session, str(raw["listing_id"]), owner_id, {"status": "active"}
                    )
                elif raw.get("product_id"):
                    await shop_products_svc.update_product(
                        session, str(raw["product_id"]), owner_id, {"is_active": True}
                    )
                else:
                    raise HTTPException(400, "Item sem listing_id/product_id")
                results.append({"id": raw.get("id"), "ok": True})
            elif action in {"archive", "delete"}:
                if kind == "cards" and raw.get("listing_id"):
                    await card_listings_svc.update_listing(
                        session, str(raw["listing_id"]), owner_id, {"status": "inactive"}
                    )
                elif raw.get("product_id"):
                    await shop_products_svc.update_product(
                        session, str(raw["product_id"]), owner_id, {"is_active": False}
                    )
                else:
                    raise HTTPException(400, "Item sem listing_id/product_id")
                results.append({"id": raw.get("id"), "ok": True})
            else:
                raise HTTPException(400, f"Ação inválida: {action}")
        except Exception as exc:  # noqa: BLE001 — coletar erros por linha
            errors.append(f"{raw.get('id')}: {exc}")

    return {
        "action": action,
        "processed": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors[:20],
    }
