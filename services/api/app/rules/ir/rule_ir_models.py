"""Modelos de IR formal para regras (serializável, versionável)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

IRVersion = Literal["1.0"]


@dataclass
class RuleIRDocument:
    rule_id: str
    rule_type: str
    ir_version: IRVersion = "1.0"
    conditions: list[dict[str, Any]] = field(default_factory=list)
    timing_windows: list[str] = field(default_factory=list)
    precedence_constraints: list[str] = field(default_factory=list)
    mutations: list[dict[str, Any]] = field(default_factory=list)
    continuous_effects: list[str] = field(default_factory=list)
    dependencies: list[str] = field(default_factory=list)
    state_requirements: list[str] = field(default_factory=list)
    generated_events: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "rule_type": self.rule_type,
            "ir_version": self.ir_version,
            "conditions": list(self.conditions),
            "timing_windows": list(self.timing_windows),
            "precedence_constraints": list(self.precedence_constraints),
            "mutations": list(self.mutations),
            "continuous_effects": list(self.continuous_effects),
            "dependencies": list(self.dependencies),
            "state_requirements": list(self.state_requirements),
            "generated_events": list(self.generated_events),
            "metadata": dict(self.metadata),
        }
