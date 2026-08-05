"""Sprint 0 — higiene da vitrine pública."""

import pytest
from fastapi import HTTPException

from app.marketplace.marketplace_hygiene import (
    assert_public_listing_payload,
    is_valid_public_image_url,
    sanitize_public_images,
)

# Card art (valid). Set logo/symbol are NOT packshots (ADR-016).
CARD_IMG = "https://images.pokemontcg.io/swsh3/136.png"
SET_LOGO = "https://images.pokemontcg.io/swsh3/logo.png"
SET_SYMBOL = "https://images.pokemontcg.io/swsh3/symbol.png"
SLEEVE_IMG = "https://www.gamegenic.com/wp-content/uploads/fb-prime_sleeves.jpg"


def test_rejects_fixture_image():
    assert not is_valid_public_image_url("fixture://card.png")
    assert not is_valid_public_image_url("/local/path.png")
    assert is_valid_public_image_url(CARD_IMG)


def test_rejects_set_logo_and_symbol_as_packshot():
    assert not is_valid_public_image_url(SET_LOGO)
    assert not is_valid_public_image_url(SET_SYMBOL)
    assert not is_valid_public_image_url("https://svgs.scryfallcdn.com/sets/neo.svg")


def test_rejects_example_and_placeholder_hosts():
    assert not is_valid_public_image_url("https://cdn.judgetcg.example/x.webp")
    assert not is_valid_public_image_url("https://via.placeholder.com/800.png?text=x")
    assert not is_valid_public_image_url("https://cdn.example.com/card.jpg")


def test_sanitize_drops_junk():
    clean = sanitize_public_images(
        [
            "fixture://x",
            SET_LOGO,
            CARD_IMG,
            "not-a-url",
            "https://www.amazon.com/s?k=sleeves",
            "https://cdn.judgetcg.example/x.webp",
        ]
    )
    assert clean == [CARD_IMG]


def test_assert_rejects_test_name():
    with pytest.raises(HTTPException) as exc:
        assert_public_listing_payload(
            name="Sleeve teste",
            description=None,
            sku=None,
            images=[CARD_IMG],
            price_cents=1000,
        )
    assert exc.value.status_code == 400


def test_assert_rejects_persona_sku():
    with pytest.raises(HTTPException) as exc:
        assert_public_listing_payload(
            name="Carta real",
            description=None,
            sku="PERSONA-ABC",
            images=[CARD_IMG],
            price_cents=1000,
        )
    assert exc.value.status_code == 400


def test_assert_requires_image():
    with pytest.raises(HTTPException) as exc:
        assert_public_listing_payload(
            name="Booster Box",
            description=None,
            sku=None,
            images=[],
            price_cents=9990,
        )
    assert "imagem" in exc.value.detail.lower()


def test_assert_rejects_outlier_price_without_catalog():
    with pytest.raises(HTTPException) as exc:
        assert_public_listing_payload(
            name="Carta rara",
            description=None,
            sku=None,
            images=[CARD_IMG],
            price_cents=1_500_000,
            catalog_card_id=None,
        )
    assert exc.value.status_code == 400


def test_assert_ok_payload():
    clean = assert_public_listing_payload(
        name="Booster Box Scarlet & Violet",
        description="Lacrado",
        sku="SV-BB-01",
        images=[CARD_IMG, "fixture://skip", SET_LOGO],
        price_cents=45_000,
    )
    assert clean == [CARD_IMG]


def test_resolve_listing_images_prefers_stored_then_fallbacks():
    from app.marketplace.marketplace_hygiene import resolve_listing_images

    assert resolve_listing_images(
        stored=[CARD_IMG],
        asset_cdn_url="https://other.example/x.png",
    ) == [CARD_IMG]
    assert resolve_listing_images(
        stored=["fixture://x", SET_LOGO],
        asset_cdn_url=SLEEVE_IMG,
    ) == [SLEEVE_IMG]


def test_resolve_listing_images_normalizes_tcgdex_fallback():
    from app.marketplace.marketplace_hygiene import resolve_listing_images

    assert resolve_listing_images(
        stored=[],
        catalog_image_url="https://assets.tcgdex.net/en/xy/xy8/40",
    ) == ["https://assets.tcgdex.net/en/xy/xy8/40/high.webp"]
