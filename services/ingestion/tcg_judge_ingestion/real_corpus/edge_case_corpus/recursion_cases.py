"""Recursão de efeitos."""

from __future__ import annotations


def recursion_depth_hint(depth: int) -> dict[str, object]:
    return {"depth": depth, "assistant_guidance": "Aplicar limite explícito do TCG e parar com estado estável."}
