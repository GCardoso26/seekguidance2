"""Stress de dependências ocultas."""

from __future__ import annotations


def hidden_dependency_pressure(count: int) -> dict[str, object]:
    return {"pressure": count > 3, "implicit_links": count}
