"""Entidades semânticas base de gameplay."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class SemanticEntity:
    name: str
    category: str
