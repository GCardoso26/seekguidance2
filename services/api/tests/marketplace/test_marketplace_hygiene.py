"""Sprint 0 — higiene da vitrine pública."""

import pytest
from fastapi import HTTPException

from app.marketplace.marketplace_hygiene import (
    assert_public_listing_payload,
    is_valid_public_image_url,
    sanitize_public_images,
)


def test_rejects_fixture_image():
    assert not is_valid_public_image_url("fixture://card.png")
    assert not is_valid_public_image_url("/local/path.png")
    assert is_valid_public_image_url("https://cdn.example.com/card.jpg")


def test_rejects_amazon_search_url():
    assert not is_valid_public_image_url(
        "https://www.amazon.com/s?k=pokemon+sleeves"
    )


def test_sanitize_drops_junk():
    clean = sanitize_public_images(
        [
            "fixture://x",
            "https://ok.example/a.jpg",
            "not-a-url",
            "https://www.amazon.com/s?k=sleeves",
        ]
    )
    assert clean == ["https://ok.example/a.jpg"]


def test_assert_rejects_test_name():
    with pytest.raises(HTTPException) as exc:
        assert_public_listing_payload(
            name="Sleeve teste",
            description=None,
            sku=None,
            images=["https://cdn.example.com/a.jpg"],
            price_cents=1000,
        )
    assert exc.value.status_code == 400


def test_assert_rejects_persona_sku():
    with pytest.raises(HTTPException) as exc:
        assert_public_listing_payload(
            name="Carta real",
            description=None,
            sku="PERSONA-ABC",
            images=["https://cdn.example.com/a.jpg"],
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
            images=["https://cdn.example.com/a.jpg"],
            price_cents=1_500_000,
            catalog_card_id=None,
        )
    assert exc.value.status_code == 400


def test_assert_ok_payload():
    clean = assert_public_listing_payload(
        name="Booster Box Scarlet & Violet",
        description="Lacrado",
        sku="SV-BB-01",
        images=["https://cdn.example.com/box.jpg", "fixture://skip"],
        price_cents=45_000,
    )
    assert clean == ["https://cdn.example.com/box.jpg"]
