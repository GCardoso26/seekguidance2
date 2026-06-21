"""Testes do pipeline de catálogo Fase 0."""

from app.catalog.validate import validate_card_payload


def test_validate_card_ok():
    result = validate_card_payload(
        {
            "game_code": "MTG",
            "external_id": "abc-123",
            "name": "Lightning Bolt",
            "normalized_name": "lightning bolt",
        }
    )
    assert result.is_valid


def test_validate_card_missing_name():
    result = validate_card_payload({"game_code": "MTG", "external_id": "x", "normalized_name": "x"})
    assert not result.is_valid


def test_normalize_name_helper():
    from app.tcg_adapters.sync_common import normalize_name

    assert normalize_name("  Lightning   Bolt  ") == "lightning bolt"
