"""Evolução de ontologia por etiqueta de versão."""

from __future__ import annotations

from typing import Any


class OntologyVersionStore:
    def __init__(self) -> None:
        self._versions: list[dict[str, Any]] = []

    def register(self, *, version_label: str, ontology_digest: str, notes: str = "") -> None:
        self._versions.append(
            {"version_label": version_label, "ontology_digest": ontology_digest, "notes": notes}
        )

    def timeline(self) -> list[dict[str, Any]]:
        return [dict(v) for v in self._versions]
