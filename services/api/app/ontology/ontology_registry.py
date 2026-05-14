"""Registry de ontologia semântica."""

from __future__ import annotations

from typing import Any


class OntologyRegistry:
    def __init__(self) -> None:
        self._nodes: dict[str, dict[str, Any]] = {}

    def register(self, name: str, payload: dict[str, Any]) -> None:
        self._nodes[name] = dict(payload)

    def all_nodes(self) -> dict[str, dict[str, Any]]:
        return dict(self._nodes)
