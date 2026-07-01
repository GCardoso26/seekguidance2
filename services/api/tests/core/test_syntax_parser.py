"""Testes do parser de sintaxe de busca."""

from app.core.search.syntax_parser import syntax_parser


def test_parse_name_and_set():
    result = syntax_parser.parse('name:"Sol Ring" set:cmd')
    assert result["text_query"] == ""
    assert len(result["filters"]) == 2
    assert result["filters"][0].field == "name"
    assert result["filters"][0].value == "Sol Ring"
    assert result["filters"][1].field == "set"
    assert result["errors"] == []


def test_parse_text_with_filters():
    result = syntax_parser.parse("bolt rarity:common")
    assert result["text_query"] == "bolt"
    assert len(result["filters"]) == 1
    assert result["filters"][0].field == "rarity"


def test_parse_numeric_cmc():
    result = syntax_parser.parse("cmc<=3")
    assert result["filters"][0].value == 3.0
    assert result["filters"][0].operator == "<="


def test_parse_boolean_foil():
    result = syntax_parser.parse("foil:true")
    assert result["filters"][0].value is True


def test_unknown_field_error():
    result = syntax_parser.parse("foo:bar")
    assert any("desconhecido" in e for e in result["errors"])


def test_catalog_sql_clauses():
    parsed = syntax_parser.parse("set:lea rarity:mythic")
    clauses, params = syntax_parser.catalog_sql_clauses(parsed)
    assert len(clauses) == 2
    assert "set_code" in clauses[0].lower() or "LOWER" in clauses[0]
    assert len(params) == 2
