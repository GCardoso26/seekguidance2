"""Compilação StructuredRule → IR."""

from __future__ import annotations

from app.rules.compiler.compiler_pipeline import compile_rule_dict


def test_compile_pipeline_basic() -> None:
    d = {
        "rule_id": "999.test",
        "game": "mtg",
        "rule_type": "unknown",
        "dependencies": ["100", "101"],
        "state_effects": ["noop"],
    }
    doc = compile_rule_dict(d)
    assert doc.rule_id == "999.test"
    assert doc.dependencies
