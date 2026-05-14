"""Anotações de timing."""

from __future__ import annotations


def timing_annotation(tokens: list[str]) -> list[str]:
    out: list[str] = []
    if "cleanup" in " ".join(tokens):
        out.append("timing::cleanup")
    if "whenever" in tokens:
        out.append("timing::triggered")
    return out
