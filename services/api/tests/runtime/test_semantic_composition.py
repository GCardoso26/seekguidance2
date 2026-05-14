"""Composição semântica."""

from __future__ import annotations

from app.rules.composition.rule_composer import compose_documents
from app.rules.ir.rule_ir_models import RuleIRDocument


def test_compose_empty() -> None:
    assert compose_documents([])["rule_ids"] == []


def test_compose_merge() -> None:
    a = RuleIRDocument(rule_id="a", rule_type="x", dependencies=["1"])
    b = RuleIRDocument(rule_id="b", rule_type="y", dependencies=["2", "1"])
    c = compose_documents([a, b])
    assert "1" in c["merged_dependencies"]
