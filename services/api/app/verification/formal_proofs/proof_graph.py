"""Grafo de prova legível (nós + arestas causais)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ProofNode:
    node_id: str
    label: str
    payload: dict[str, Any] = field(default_factory=dict)


@dataclass
class ProofGraph:
    nodes: list[ProofNode] = field(default_factory=list)
    edges: list[tuple[str, str, str]] = field(default_factory=list)
