"""Modelo de nós / arestas (documentação de schema; construção em graph_builder)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class InteractionNode:
    node_id: str
    kind: str
    label: str


@dataclass
class ReasoningEdge:
    source: str
    target: str
    edge_type: str
