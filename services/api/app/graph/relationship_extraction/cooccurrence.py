"""Co-ocorrência de cabeçalhos de regra em janelas locais (mesmo documento / ordem de chunks)."""

from __future__ import annotations

from collections import Counter


def pair_counts_from_ordered_heads(
    chunks_heads: list[frozenset[str]],
    *,
    window: int = 4,
) -> Counter[tuple[str, str]]:
    """Conta pares não ordenados (min,max) de heads que aparecem na mesma janela deslizante."""
    counts: Counter[tuple[str, str]] = Counter()
    w = max(1, window)
    for i in range(len(chunks_heads)):
        window_sets = chunks_heads[i : i + w]
        heads_in: set[str] = set()
        for s in window_sets:
            heads_in |= set(s)
        heads_l = sorted(heads_in)
        for a in range(len(heads_l)):
            for b in range(a + 1, len(heads_l)):
                x, y = heads_l[a], heads_l[b]
                key = (x, y) if x < y else (y, x)
                counts[key] += 1
    return counts


def normalize_cooccurrence(count: int, max_observed: int) -> float:
    if max_observed <= 0:
        return 0.0
    return max(0.0, min(1.0, float(count) / float(max_observed)))


def max_pair_count(counts: dict[tuple[str, str], int] | Counter[tuple[str, str]]) -> int:
    return max(counts.values(), default=0)
