"""Versionamento da ontologia."""

from __future__ import annotations


def ontology_version_tag(game_slug: str, period: str) -> str:
    return f"{game_slug}_ontology_{period}"
