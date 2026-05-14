"""Runtime APNAP (Active Player, Non-Active Player order)."""

from __future__ import annotations

from collections.abc import Iterable


def apnap_sequence(active: str, others: Iterable[str]) -> list[str]:
    return [active, *sorted(others)]
