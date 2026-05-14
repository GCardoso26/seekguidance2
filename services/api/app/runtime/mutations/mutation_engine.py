"""Motor formal de mutações (append-only log)."""

from __future__ import annotations

from typing import Any

from app.rules.ir.rule_ir_models import RuleIRDocument
from app.runtime.mutations.mutation_history import MutationHistory
from app.runtime.mutations.mutation_validation import validate_mutation_dict
from app.runtime.sandbox.mutation_limits import cap_mutations


class MutationEngine:
    def __init__(self, *, max_per_tick: int = 128) -> None:
        self.max_per_tick = max_per_tick
        self.history = MutationHistory()

    def materialize_from_ir(self, docs: list[RuleIRDocument]) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        for d in docs:
            capped, trimmed = cap_mutations(list(d.mutations), self.max_per_tick)
            if trimmed:
                self.history.record({"type": "mutation_cap", "rule_id": d.rule_id})
            for m in capped:
                if isinstance(m, dict):
                    try:
                        validate_mutation_dict(m)
                    except Exception:
                        continue
                    mm = dict(m)
                    mm.setdefault("rule_id", d.rule_id)
                    out.append(mm)
                    self.history.record({"applied": mm})
        return out
