"""Formal Rule IR (intermediate representation)."""

from app.rules.ir.ir_builder import build_ir_from_structured
from app.rules.ir.ir_serialization import deserialize_ir, serialize_ir
from app.rules.ir.rule_ir_models import RuleIRDocument

__all__ = [
    "RuleIRDocument",
    "build_ir_from_structured",
    "serialize_ir",
    "deserialize_ir",
]
