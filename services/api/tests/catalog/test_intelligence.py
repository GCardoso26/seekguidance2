"""Testes Catalog Intelligence Sprint 13."""

from app.catalog.intelligence_service import _extract_taxonomy


def test_extract_taxonomy_type_line() -> None:
    tax = _extract_taxonomy({"type_line": "Legendary Creature — Dragon"})
    assert "Legendary" in tax["types"] or "Creature" in tax["types"]
    assert "Dragon" in tax["subtypes"]


def test_extract_taxonomy_finishes_and_errata() -> None:
    tax = _extract_taxonomy(
        {
            "type_line": "Sorcery",
            "borderless": True,
            "promo": True,
            "errata": [{"date": "2024-01-01", "text": "Corrigido texto"}],
        }
    )
    assert "borderless" in tax["finishes"]
    assert "promo" in tax["finishes"]
    assert len(tax["erratas"]) == 1
    assert "Corrigido" in tax["erratas"][0]["text"]


def test_extract_taxonomy_empty() -> None:
    tax = _extract_taxonomy(None)
    assert tax["types"] == []
    assert tax["finishes"] == []
