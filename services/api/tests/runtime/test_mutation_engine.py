"""Motor de mutações."""

from __future__ import annotations

from app.rules.ir.rule_ir_models import RuleIRDocument
from app.runtime.mutations.mutation_engine import MutationEngine


def test_mutation_engine_collects() -> None:
    doc = RuleIRDocument(
        rule_id="r1",
        rule_type="layer_continuous",
        mutations=[
            {"mutation_type": "modify_power", "target_object": "o1", "source_effect": "ce"},
        ],
    )
    eng = MutationEngine()
    out = eng.materialize_from_ir([doc])
    assert len(out) == 1
    assert out[0]["rule_id"] == "r1"
