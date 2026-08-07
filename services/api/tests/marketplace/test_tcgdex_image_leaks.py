"""Leitura pública de image_url deve normalizar bases TCGdex (sem /high.webp)."""

import asyncio

from app.marketplace.catalog_marketplace_adapter import (
    CatalogMarketplaceAdapter,
    ListingCatalogProjection,
)
from app.marketplace.marketplace_sellers import _serialize_product

_BARE = "https://assets.tcgdex.net/en/xy/xy8/40"
_FULL = "https://assets.tcgdex.net/en/xy/xy8/40/high.webp"


def test_serialize_seller_product_normalizes_tcgdex_image_url():
    payload = _serialize_product(
        {
            "listing_id": "l1",
            "product_id": "p1",
            "card_id": "c1",
            "card_name": "Pikachu",
            "quantity": 1,
            "price_cents": 100,
            "currency": "BRL",
            "condition": "NM",
            "language": "en",
            "foil": False,
            "set_code": "xy8",
            "set_name": "Breakthrough",
            "image_url": _BARE,
        }
    )
    assert payload["image_url"] == _FULL


def test_marketplace_dto_normalizes_tcgdex_image_url():
    projection = ListingCatalogProjection(
        listing_id="l1",
        card_id="c1",
        card_name="Pikachu",
        game_code="POKEMON",
        set_name="Breakthrough",
        image_url=_BARE,
        price_cents=100,
        condition="NM",
        store_id="s1",
        store_name="Loja",
        store_slug="loja",
    )
    adapter = CatalogMarketplaceAdapter.__new__(CatalogMarketplaceAdapter)
    result = asyncio.run(adapter.to_marketplace_dto(projection))
    assert result["image_url"] == _FULL
