"""Import CSV no formato export LigaLorcana."""

from __future__ import annotations

from app.marketplace.shop_inventory import (
    LIGA_LORCANA_SET_MAP,
    _catalog_set_from_liga,
    _is_liga_lorcana_headers,
    _normalize_card_number,
    _parse_liga_lorcana_row,
    _strip_csv_preamble,
    match_liga_lorcana_catalog,
)


def test_detects_liga_headers():
    headers = [
        "Tipo",
        "Edição ID",
        "Carta ID",
        "Nome da Carta EN",
        "Quantidade Existente",
        "Preço",
    ]
    assert _is_liga_lorcana_headers(headers)


def test_strip_preamble_keeps_header():
    raw = (
        ',,,,,"instruções"\n'
        '"Tipo","Carta ID","Nome da Carta EN","Quantidade Existente","Preço"\n'
        '"9","1","Abu","2","1.00"\n'
    )
    out = _strip_csv_preamble(raw)
    assert out.startswith('"Tipo"')


def test_parse_liga_row_uses_existente_when_somar_empty():
    row = {
        "Nome da Carta": "",
        "Nome da Carta EN": "Abu - Bold Helmsman",
        "Qualidade (M, NM, SP, MP, HP, D)": "NM",
        "Quantidade Existente": "20",
        "Quantidade Para Somar": "",
        "Preço": "0.30",
        "Edição Sigla": "LOR6",
        "Carta ID": "1324",
        "Número": '="114"',
        "Foil (0 ou 1)": "",
    }
    parsed, err = _parse_liga_lorcana_row(row, 12)
    assert err is None
    assert parsed is not None
    assert parsed["name"] == "Abu - Bold Helmsman (NM)"
    assert parsed["stock"] == 20
    assert parsed["price_cents"] == 30
    assert parsed["category"] == "single"
    assert parsed["sku"] and "LOR6" in parsed["sku"]
    assert parsed["base_name"] == "Abu - Bold Helmsman"
    assert parsed["card_number"] == "114"
    assert parsed["liga_set"] == "LOR6"


def test_parse_liga_skips_zero_stock():
    row = {
        "Nome da Carta EN": "A Pirate's Life",
        "Quantidade Existente": "0",
        "Preço": "0.50",
        "Qualidade (M, NM, SP, MP, HP, D)": "NM",
    }
    parsed, err = _parse_liga_lorcana_row(row, 3)
    assert parsed is None
    assert err is None


def test_liga_set_map_covers_main_sets():
    assert LIGA_LORCANA_SET_MAP["LOR1"] == "TFC"
    assert LIGA_LORCANA_SET_MAP["LOR7"] == "ARI"
    assert LIGA_LORCANA_SET_MAP["LOR12"] == "WUN"
    assert _catalog_set_from_liga("LOR5") == "SSK"
    assert _normalize_card_number('="041"') == "41"


def test_match_liga_lorcana_by_set_and_number():
    card = {
        "id": "c1",
        "name": "Amber Coil",
        "normalized_name": "amber coil",
        "set_code": "ARI",
        "external_id": "ARI-041",
        "image_url": "https://example.com/coil.png",
    }
    by_set_num = {("ARI", "41"): card, ("ARI", "041"): card}
    by_set_name = {("ARI", "amber coil"): card}
    hit = match_liga_lorcana_catalog(
        base_name="Amber Coil",
        liga_set="LOR7",
        card_number="41",
        by_set_num=by_set_num,
        by_set_name=by_set_name,
    )
    assert hit is not None
    assert hit["id"] == "c1"
