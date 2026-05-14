"""Estado de jogo simbólico: zonas como multi-conjuntos de tags, flags globais."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class SymbolicGameState:
    state_id: str
    zones: dict[str, frozenset[str]] = field(default_factory=dict)
    flags: dict[str, bool] = field(default_factory=dict)
    meta: dict[str, Any] = field(default_factory=dict)

    def canonical_key(self) -> str:
        zitems = ",".join(f"{k}:{','.join(sorted(v))}" for k, v in sorted(self.zones.items()))
        fitems = ",".join(f"{k}={'1' if v else '0'}" for k, v in sorted(self.flags.items()))
        return f"{self.state_id}|{zitems}|{fitems}"
