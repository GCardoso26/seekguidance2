"""Migração de versões de ontologia."""

from __future__ import annotations


def migrate_ontology(version_from: str, version_to: str) -> dict[str, str]:
    return {"from": version_from, "to": version_to, "status": "planned"}
