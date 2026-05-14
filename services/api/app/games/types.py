"""Tipos partilhados entre jogos (evita import circular em `registry`)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GameSemanticPack:
    slug: str
    display_name: str
    graph_expansion_bias: float
    ontology_version: str
