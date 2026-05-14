"""Validação estática do IR."""

from __future__ import annotations

from app.rules.ir.rule_ir_models import RuleIRDocument


class IRValidationError(Exception):
    pass


def validate(doc: RuleIRDocument) -> None:
    if not doc.rule_id:
        raise IRValidationError("rule_id obrigatório")
    if not doc.rule_type:
        raise IRValidationError("rule_type obrigatório")
    if doc.ir_version != "1.0":
        raise IRValidationError("ir_version não suportada")
