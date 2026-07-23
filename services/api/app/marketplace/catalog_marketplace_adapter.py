"""ACL formal Catalog ↔ Marketplace (Sprint 15).

Marketplace nunca consulta tabelas do Catalog diretamente.
Catalog expõe snapshots via este adapter para leitura no Marketplace.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.marketplace_hygiene import STORE_NOT_TEST_SQL
from app.marketplace.shop_store import STORE_SELLABLE_SQL


@dataclass(frozen=True)
class CatalogSnapshot:
    """DTO imutável — visão do catálogo para o Marketplace."""

    card_id: str
    name: str
    game_code: str | None
    set_name: str | None
    image_url: str | None
    language: str | None
    taxonomy: dict[str, Any]


@dataclass(frozen=True)
class ListingCatalogProjection:
    """Projeção de listing enriquecida com dados do catálogo (read model)."""

    listing_id: str
    card_id: str
    card_name: str
    game_code: str | None
    set_name: str | None
    image_url: str | None
    price_cents: int
    condition: str
    store_id: str
    store_name: str | None
    store_slug: str | None
    store_product_id: str | None = None
    quantity: int = 0
    foil: bool = False
    language: str | None = None


class CatalogMarketplaceAdapter:
    """Anti-Corruption Layer — único ponto de leitura Catalog → Marketplace."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_card_snapshot(self, card_id: str) -> CatalogSnapshot | None:
        try:
            cid = UUID(str(card_id))
        except ValueError:
            return None
        row = (
            await self._session.execute(
                text(
                    """
                    SELECT id, name, game_code, set_name, image_url, language, game_data
                    FROM tcg_judge.card_catalog
                    WHERE id = :id
                    """
                ),
                {"id": cid},
            )
        ).mappings().first()
        if not row:
            return None
        gd = row.get("game_data") or {}
        if isinstance(gd, str):
            import json

            gd = json.loads(gd)
        taxonomy = {
            "rarity": (gd or {}).get("rarity"),
            "types": (gd or {}).get("types") or (gd or {}).get("type"),
            "collector_number": (gd or {}).get("collector_number"),
        }
        return CatalogSnapshot(
            card_id=str(row["id"]),
            name=str(row["name"]),
            game_code=row.get("game_code"),
            set_name=row.get("set_name"),
            image_url=row.get("image_url"),
            language=row.get("language"),
            taxonomy=taxonomy,
        )

    async def project_listings_for_card(self, card_id: str, *, limit: int = 50) -> list[ListingCatalogProjection]:
        try:
            cid = UUID(str(card_id))
        except ValueError:
            return []
        rows = (
            await self._session.execute(
                text(
                    """
                    SELECT
                      cl.id AS listing_id,
                      cl.card_id,
                      cc.name AS card_name,
                      cc.game_code,
                      cc.set_name,
                      COALESCE(cc.image_url, cl.images[1]) AS image_url,
                      cl.price_cents,
                      cl.condition,
                      cl.store_id,
                      cl.store_product_id,
                      cl.quantity,
                      cl.foil,
                      cl.language,
                      s.name AS store_name,
                      s.slug AS store_slug
                    FROM tcg_judge.card_listings cl
                    JOIN tcg_judge.card_catalog cc ON cc.id = cl.card_id
                    JOIN tcg_judge.stores s ON s.id = cl.store_id
                    WHERE cl.card_id = :cid
                      AND cl.status = 'active'
                      AND cl.store_product_id IS NOT NULL
                      AND """
                    + STORE_SELLABLE_SQL.strip()
                    + " AND "
                    + STORE_NOT_TEST_SQL
                    + """
                    ORDER BY cl.price_cents ASC
                    LIMIT :lim
                    """
                ),
                {"cid": cid, "lim": limit},
            )
        ).mappings().all()
        return [
            ListingCatalogProjection(
                listing_id=str(r["listing_id"]),
                card_id=str(r["card_id"]),
                card_name=str(r["card_name"]),
                game_code=r.get("game_code"),
                set_name=r.get("set_name"),
                image_url=r.get("image_url"),
                price_cents=int(r["price_cents"]),
                condition=str(r["condition"]),
                store_id=str(r["store_id"]),
                store_name=r.get("store_name"),
                store_slug=r.get("store_slug"),
                store_product_id=str(r["store_product_id"]) if r.get("store_product_id") else None,
                quantity=int(r.get("quantity") or 0),
                foil=bool(r.get("foil")),
                language=r.get("language"),
            )
            for r in rows
        ]

    async def to_marketplace_dto(self, projection: ListingCatalogProjection) -> dict[str, Any]:
        return {
            "listing_id": projection.listing_id,
            "card_id": projection.card_id,
            "card_name": projection.card_name,
            "game_code": projection.game_code,
            "set_name": projection.set_name,
            "image_url": projection.image_url,
            "price_cents": projection.price_cents,
            "condition": projection.condition,
            "store_product_id": projection.store_product_id,
            "quantity": projection.quantity,
            "foil": projection.foil,
            "language": projection.language,
            "store": {
                "id": projection.store_id,
                "name": projection.store_name,
                "slug": projection.store_slug,
            },
        }
