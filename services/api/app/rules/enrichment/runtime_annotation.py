"""Anotações runtime-ready."""

from __future__ import annotations


def runtime_annotation(tokens: list[str]) -> list[str]:
    anns = []
    if "priority" in tokens:
        anns.append("runtime::priority_window")
    if "replace" in " ".join(tokens):
        anns.append("runtime::replacement_hook")
    return anns
