"""Decomposição de queries complexas em eixos de retrieval e seeds de grafo."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.graph.relationship_extraction.extractor import extract_rule_heads
from app.query_understanding.intent_classifier import QueryIntent
from app.query_understanding.semantic_router import RetrievalHint

_SPLIT_PATTERN = re.compile(r"\b(?:and|with|vs\.?|during|when|while|how)\b", re.I)


# Termos MTG comuns → cabeçalhos CR de seed (não exaustivo; extensível por TCG).
_HEAD_HINTS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\breplacement\b", re.I), "614"),
    (re.compile(r"\bstate[- ]?based\b|\bSBA\b", re.I), "704"),
    (re.compile(r"\bcleanup\b", re.I), "514"),
    (re.compile(r"\btriggered\b", re.I), "603"),
    (re.compile(r"\bpriority\b", re.I), "117"),
    (re.compile(r"\bstack\b", re.I), "405"),
    (re.compile(r"\blayer\b", re.I), "613"),
    (re.compile(r"\bcombat\b", re.I), "506"),
]


@dataclass(frozen=True)
class QueryDecomposition:
    original: str
    sub_queries: tuple[str, ...]
    graph_seeds: tuple[str, ...]
    lexical_augmentation: str
    complexity: float  # 0–1


def _split_clauses(q: str) -> list[str]:
    parts = [p.strip() for p in _SPLIT_PATTERN.split(q) if p.strip()]
    return parts if len(parts) > 1 else [q.strip()]


def _complexity_score(q: str, hint: RetrievalHint) -> float:
    n = len(q.split())
    base = min(1.0, n / 42.0)
    if len(hint.analysis.secondary) > 0:
        base += 0.12
    if hint.analysis.primary in (
        QueryIntent.replacement_effects,
        QueryIntent.triggered_abilities,
        QueryIntent.timing,
        QueryIntent.layers,
    ):
        base += 0.1
    if "?" in q and (" and " in q.lower() or " with " in q.lower()):
        base += 0.08
    return max(0.0, min(1.0, base))


def decompose_query(question: str, hint: RetrievalHint) -> QueryDecomposition:
    q = question.strip()
    clauses = _split_clauses(q)
    sub: list[str] = []
    for c in clauses:
        c = c.rstrip("?").strip()
        if len(c) >= 8:
            sub.append(c[:400])
    if not sub:
        sub = [q[:400]]

    seeds: list[str] = []
    for pat, head in _HEAD_HINTS:
        if pat.search(q):
            seeds.append(head)
    seeds.extend(sorted(extract_rule_heads(q)))
    # dedupe preserve order
    seen: set[str] = set()
    graph_seeds: list[str] = []
    for s in seeds:
        if s not in seen:
            seen.add(s)
            graph_seeds.append(s)

    aug_parts = list(sub[:4])
    aug_parts.extend(graph_seeds[:6])
    lexical_augmentation = " ".join(dict.fromkeys(aug_parts))[:900]

    return QueryDecomposition(
        original=q,
        sub_queries=tuple(sub[:8]),
        graph_seeds=tuple(graph_seeds[:12]),
        lexical_augmentation=lexical_augmentation,
        complexity=_complexity_score(q, hint),
    )
