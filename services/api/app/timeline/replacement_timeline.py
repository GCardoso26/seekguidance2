"""Linha do tempo de replacement effects."""

from __future__ import annotations


def replacement_events(count: int) -> list[dict[str, str]]:
    return [{"replacement": f"r{i}", "status": "evaluated"} for i in range(max(0, count))]
