"""Import CSV no formato export LigaLorcana."""

from __future__ import annotations

from app.marketplace.shop_inventory import (
    _is_liga_lorcana_headers,
    _parse_liga_lorcana_row,
    _strip_csv_preamble,
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
