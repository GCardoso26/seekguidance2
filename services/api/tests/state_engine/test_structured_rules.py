"""Regras estruturadas."""

from app.rules.rule_parser import parse_rule_path


def test_parse_603_3b() -> None:
    r = parse_rule_path("603.3b", "mtg")
    assert r is not None
    assert r.rule_id == "603.3b"
    assert r.rule_type == "trigger_resolution"
