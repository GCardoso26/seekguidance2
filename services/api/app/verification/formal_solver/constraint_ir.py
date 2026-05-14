"""IR neutro para constraints (entrada para SMT/SAT futuro)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

VarType = Literal["bool", "int", "enum"]


@dataclass
class Var:
    name: str
    vtype: VarType = "bool"


@dataclass
class Constraint:
    kind: Literal["eq", "implies", "and", "or", "not"]
    args: tuple[Any, ...]


@dataclass
class FormalIR:
    """Grafo de constraints serializável (sem solver acoplado)."""

    variables: list[Var] = field(default_factory=list)
    constraints: list[Constraint] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
