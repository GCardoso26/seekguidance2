"""IR formal — serialização e registry."""

from __future__ import annotations

from app.retrieval.types import ChunkHit
from app.rules.ir.ir_serialization import deserialize_ir, serialize_ir
from app.rules.ir.rule_ir_models import RuleIRDocument
from app.rules.rule_registry import get_structured_rules


def test_rule_ir_roundtrip() -> None:
    doc = RuleIRDocument(rule_id="603.3b", rule_type="trigger_resolution", generated_events=["x"])
    raw = serialize_ir(doc)
    back = deserialize_ir(raw)
    assert back.rule_id == "603.3b"
    assert back.generated_events == ["x"]


def test_build_from_registry_dict() -> None:
    hits: list[ChunkHit] = []
    structured = get_structured_rules("mtg", hits)
    assert any(r["rule_id"] == "603.3b" for r in structured)
