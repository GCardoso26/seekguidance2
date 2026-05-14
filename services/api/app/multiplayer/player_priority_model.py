"""Modelo formal de prioridade de jogadores."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PlayerPriorityModel:
    active_player: str
    non_active_order: tuple[str, ...]


def build_apnap_order(active: str, others: list[str]) -> tuple[str, ...]:
    return tuple(sorted([active, *others]))
