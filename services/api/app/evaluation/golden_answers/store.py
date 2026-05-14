"""Respostas canónicas validadas por juízes (armazenamento mínimo)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class GoldenAnswer:
    question_id: str
    game_slug: str
    canonical_outcome: dict[str, Any] = field(default_factory=dict)
    citations: list[str] = field(default_factory=list)


_GOLDEN: list[GoldenAnswer] = []


def register_golden(ans: GoldenAnswer) -> None:
    _GOLDEN.append(ans)


def list_golden() -> list[GoldenAnswer]:
    return list(_GOLDEN)
