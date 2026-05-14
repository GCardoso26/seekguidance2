"""Diff semântico leve entre versões de texto de ruling (stub)."""

from __future__ import annotations


def ruling_text_diff_stub(a: str, b: str) -> dict[str, object]:
    return {"changed": a != b, "len_a": len(a), "len_b": len(b)}
