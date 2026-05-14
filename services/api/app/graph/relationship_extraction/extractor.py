"""Extração lexical de referências a regras numeradas (CR / análogos)."""

from __future__ import annotations

import re

# Números de regra típicos CR (3–4 dígitos) com sub-regra opcional.
_RULE_NUM = re.compile(r"\b(\d{3,4})(\.\d+[a-z]?)*\b", re.IGNORECASE)


def extract_rule_refs(text: str) -> set[str]:
    """Referências completas encontradas no texto (ex.: 614.12, 704.5)."""
    if not text:
        return set()
    out: set[str] = set()
    for m in _RULE_NUM.finditer(text):
        full = m.group(0)
        out.add(full)
    return out


def extract_rule_heads(text: str) -> set[str]:
    """Apenas o cabeçalho principal (ex.: 614.12a -> 614)."""
    heads: set[str] = set()
    for m in _RULE_NUM.finditer(text or ""):
        head = m.group(1)
        if head.isdigit():
            heads.add(head)
    return heads


def lexical_pair_match_strength(text_a: str, text_b: str) -> float:
    """Sinal 0–1: quanto A referencia explicitamente números presentes em B (via rule_path-like tokens)."""
    refs_a = extract_rule_refs(text_a)
    heads_b = extract_rule_heads(text_b)
    if not refs_a or not heads_b:
        return 0.0
    hits = sum(1 for r in refs_a if any(r.startswith(h + ".") or r == h for h in heads_b))
    return min(1.0, hits / max(1, len(refs_a)))
