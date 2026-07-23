"""Sprint 1 — busca marketplace enriquece match via catálogo."""

from app.core.search.syntax_parser import syntax_parser


def test_shop_name_filter_matches_catalog_alias():
    parsed = syntax_parser.parse('name:Rapunzel')
    clauses, params = syntax_parser.shop_sql_clauses(parsed)
    assert any("cc.name" in c for c in clauses)
    assert any("%Rapunzel%" in str(v) for v in params.values())


def test_shop_set_filter_uses_catalog():
    parsed = syntax_parser.parse("set:TFC")
    clauses, params = syntax_parser.shop_sql_clauses(parsed)
    assert any("set_code" in c or "set_name" in c for c in clauses)
    assert any("%TFC%" in str(v) for v in params.values())


def test_free_text_parse_preserves_staple_query():
    parsed = syntax_parser.parse("Rapunzel Gifted with Healing")
    assert parsed["text_query"]
    assert "Rapunzel" in parsed["text_query"]
