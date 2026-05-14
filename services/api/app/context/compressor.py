"""Compressão conservadora: remove redundância local sem resumo LLM genérico."""

from __future__ import annotations

import re

_LEGAL_KEEP = re.compile(
    r"\b(exception|note:|example|instead|unless|only if|see rule|doesn't|does not|can't|cannot)\b",
    re.IGNORECASE,
)


def dedupe_lines(text: str) -> str:
    seen: set[str] = set()
    out_lines: list[str] = []
    for line in text.splitlines():
        key = " ".join(line.split()).lower()
        if len(key) < 6:
            out_lines.append(line)
            continue
        if key in seen:
            continue
        seen.add(key)
        out_lines.append(line)
    return "\n".join(out_lines)


def compress_preserving_legal_semantics(text: str, max_chars: int) -> str:
    """
    Reduz overlap de linhas; preserva blocos com marcadores jurídicos/timing.
    Não substitui o texto por paráfrase — apenas corta com salvaguardas.
    """
    t = dedupe_lines(text.strip())
    if len(t) <= max_chars:
        return t

    if _LEGAL_KEEP.search(t):
        # manter início + secção que contém marcadores legais
        idx = _LEGAL_KEEP.search(t)
        assert idx is not None
        anchor = max(0, idx.start() - 120)
        head = t[: max_chars // 2]
        tail = t[anchor : anchor + (max_chars - len(head) - 30)]
        merged = head + "\n…\n" + tail
        if len(merged) <= max_chars:
            return merged

    head = t[: max_chars - 20]
    return head + "\n… [truncated]"
