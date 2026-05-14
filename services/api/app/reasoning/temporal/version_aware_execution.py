"""Execução aware de versão histórica."""

from __future__ import annotations


def runtime_version_for_period(game_slug: str, period: str) -> str:
    return f"{game_slug}_cr_{period}"
