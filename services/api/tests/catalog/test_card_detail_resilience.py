"""Regressão: detalhe de carta sem latestPrice não pode 500."""

from __future__ import annotations


def test_latest_price_none_currency_access():
    """Replica o bug: card['latestPrice'] = None quebra .get(key, {}).get(...)."""
    card = {"latestPrice": None}
    # Comportamento quebrado (antes do fix)
    broke = False
    try:
        _ = card.get("latestPrice", {}).get("currency")
    except AttributeError:
        broke = True
    assert broke

    # Comportamento corrigido
    currency = (card.get("latestPrice") or {}).get("currency") or "BRL"
    assert currency == "BRL"


def test_game_detail_fields_tolerates_non_dict():
    from app.catalog.detail_service import _game_detail_fields

    assert _game_detail_fields(None)["oracleText"] is None
    assert _game_detail_fields("not-a-dict")["legalities"] is None  # type: ignore[arg-type]
    assert _game_detail_fields({"oracle_text": "ok"})["oracleText"] == "ok"
