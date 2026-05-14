"""Representação estruturada mínima de regras (extensível, multi-TCG)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

RuleType = Literal[
    "trigger_resolution",
    "state_based_action",
    "replacement_effect",
    "layer_continuous",
    "priority_timing",
    "stack_interaction",
    "chain_interaction",
    "unknown",
]


@dataclass
class StructuredRule:
    rule_id: str
    game: str
    rule_type: RuleType = "unknown"
    timing_window: str | None = None
    precedence: list[str] = field(default_factory=list)
    dependencies: list[str] = field(default_factory=list)
    constraints: list[str] = field(default_factory=list)
    state_effects: list[str] = field(default_factory=list)
    zone_effects: list[str] = field(default_factory=list)
    interaction_semantics: list[str] = field(default_factory=list)
    version_label: str | None = None
    raw_excerpt: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "game": self.game,
            "rule_type": self.rule_type,
            "timing_window": self.timing_window,
            "precedence": list(self.precedence),
            "dependencies": list(self.dependencies),
            "constraints": list(self.constraints),
            "state_effects": list(self.state_effects),
            "zone_effects": list(self.zone_effects),
            "interaction_semantics": list(self.interaction_semantics),
            "version_label": self.version_label,
        }
