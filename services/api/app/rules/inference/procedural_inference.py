"""Inferência procedural de passos de runtime."""

from __future__ import annotations


def infer_procedural_dependencies(tokens: list[str]) -> list[str]:
    deps: list[str] = []
    if "priority" in tokens:
        deps.append("priority_pass_before_resolution")
    if "trigger" in tokens:
        deps.append("trigger_enqueue_before_resolution")
    return deps
