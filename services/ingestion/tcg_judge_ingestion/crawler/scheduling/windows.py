"""Registo declarativo de janelas de ingestão (cron-like)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class IngestionWindow:
    game_slug: str
    doc_type: str
    cron_hint: str  # ex.: "0 4 * * *" — executor real fica fora deste módulo


DEFAULT_SCHEDULE: tuple[IngestionWindow, ...] = (
    IngestionWindow("mtg", "CR", "0 4 * * *"),
    IngestionWindow("yugioh", "Rulebook", "30 4 * * *"),
)
