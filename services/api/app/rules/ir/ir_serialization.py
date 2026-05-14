"""Serialização IR ↔ dict/JSON."""

from __future__ import annotations

import json
from typing import Any

from app.rules.ir.rule_ir_models import RuleIRDocument


def serialize_ir(doc: RuleIRDocument) -> str:
    return json.dumps(doc.to_dict(), sort_keys=True, separators=(",", ":"))


def deserialize_ir(blob: str) -> RuleIRDocument:
    d = json.loads(blob)
    return RuleIRDocument(
        rule_id=d["rule_id"],
        rule_type=d["rule_type"],
        ir_version=d.get("ir_version", "1.0"),
        conditions=list(d.get("conditions", [])),
        timing_windows=list(d.get("timing_windows", [])),
        precedence_constraints=list(d.get("precedence_constraints", [])),
        mutations=list(d.get("mutations", [])),
        continuous_effects=list(d.get("continuous_effects", [])),
        dependencies=list(d.get("dependencies", [])),
        state_requirements=list(d.get("state_requirements", [])),
        generated_events=list(d.get("generated_events", [])),
        metadata=dict(d.get("metadata", {})),
    )


def ir_document_from_dict(d: dict[str, Any]) -> RuleIRDocument:
    return deserialize_ir(json.dumps(d, sort_keys=True))
