"""Testes de resolução de imagens do catálogo."""

from app.catalog.image_utils import parse_image_uris, resolve_card_image


def test_parse_image_uris_from_dict():
    uris = parse_image_uris({"normal": "https://example.com/a.jpg", "small": "https://example.com/s.jpg"})
    assert uris["normal"] == "https://example.com/a.jpg"
    assert uris["small"] == "https://example.com/s.jpg"


def test_parse_image_uris_from_json_string():
    uris = parse_image_uris('{"normal": "https://example.com/n.png"}')
    assert uris["normal"] == "https://example.com/n.png"


def test_resolve_card_image_falls_back_to_image_url():
    uris = resolve_card_image({"image_url": "https://example.com/card.webp"})
    assert uris["normal"] == "https://example.com/card.webp"


def test_resolve_card_image_prefers_image_uris():
    uris = resolve_card_image(
        {
            "image_url": "https://example.com/old.jpg",
            "image_uris": {"normal": "https://example.com/new.jpg"},
        }
    )
    assert uris["normal"] == "https://example.com/new.jpg"
