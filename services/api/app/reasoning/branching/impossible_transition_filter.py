"""Remove transições impossíveis (pré-validação leve)."""

from __future__ import annotations


def filter_impossible_transitions(
    transitions: list[dict[str, str]],
    rejected: list[dict[str, str]],
) -> list[dict[str, str]]:
    bad = {tuple(sorted(r.items())) for r in rejected if "from_state" in r}
    out: list[dict[str, str]] = []
    for t in transitions:
        if tuple(sorted(t.items())) in bad:
            continue
        out.append(t)
    return out
