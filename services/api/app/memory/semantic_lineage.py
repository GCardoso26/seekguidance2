"""Lineage simples em memória."""

from __future__ import annotations


def lineage_edges(rule_id: str, ancestors: list[str], descendants: list[str]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    out.extend({"from": a, "to": rule_id} for a in ancestors)
    out.extend({"from": rule_id, "to": d} for d in descendants)
    return out
