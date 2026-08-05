"""Testes de resolução de imagens do catálogo."""

from app.catalog.image_utils import (
    normalize_sorcery_image_url,
    normalize_tcgdex_image_url,
    parse_image_uris,
    resolve_card_image,
    sorcery_slug_to_image_url,
)


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


def test_sorcery_slug_to_image_url():
    url = sorcery_slug_to_image_url("alp-apprentice_wizard-b-s")
    assert url == "https://d27a44hjr9gen3.cloudfront.net/alp/apprentice_wizard_b_s.png"


def test_normalize_sorcery_image_url_rewrites_broken_host():
    broken = "https://cards.sorcerytcg.com/art-13_treasures_of_britain-b-s.jpg"
    fixed = normalize_sorcery_image_url(broken)
    assert fixed == "https://d27a44hjr9gen3.cloudfront.net/art/13_treasures_of_britain_b_s.png"


def test_resolve_card_image_rewrites_sorcery_urls():
    uris = resolve_card_image(
        {
            "game_code": "SORCERY",
            "card_number": "alp-apprentice_wizard-b-s",
            "image_url": "https://cards.sorcerytcg.com/alp-apprentice_wizard-b-s.jpg",
            "image_uris": {"normal": "https://cards.sorcerytcg.com/alp-apprentice_wizard-b-s.jpg"},
        }
    )
    assert uris["normal"] == "https://d27a44hjr9gen3.cloudfront.net/alp/apprentice_wizard_b_s.png"


def test_normalize_tcgdex_url_appends_quality_and_extension():
    assert (
        normalize_tcgdex_image_url("https://assets.tcgdex.net/en/xy/xy8/40")
        == "https://assets.tcgdex.net/en/xy/xy8/40/high.webp"
    )
    assert (
        normalize_tcgdex_image_url("https://assets.tcgdex.net/en/tcgp/A3/112/")
        == "https://assets.tcgdex.net/en/tcgp/A3/112/high.webp"
    )


def test_normalize_tcgdex_url_is_idempotent_and_scoped():
    already = "https://assets.tcgdex.net/en/xy/xy8/40/high.webp"
    assert normalize_tcgdex_image_url(already) == already
    other = "https://images.pokemontcg.io/xy8/40"
    assert normalize_tcgdex_image_url(other) == other
    assert normalize_tcgdex_image_url(None) is None


def test_resolve_card_image_normalizes_tcgdex_urls():
    uris = resolve_card_image(
        {
            "game_code": "POKEMON",
            "image_url": "https://assets.tcgdex.net/en/xy/xy8/40",
        }
    )
    assert uris["normal"] == "https://assets.tcgdex.net/en/xy/xy8/40/high.webp"
    assert uris["small"] == "https://assets.tcgdex.net/en/xy/xy8/40/high.webp"
