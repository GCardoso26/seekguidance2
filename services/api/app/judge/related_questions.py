"""Perguntas relacionadas pós-resposta (heurística + regras por jogo)."""

from __future__ import annotations

import re

# Sugestões por palavra-chave (inglês/português) → follow-ups
_KEYWORD_SUGGESTIONS: dict[str, list[str]] = {
    "trample": [
        "How does Double Strike work?",
        "What happens to excess combat damage?",
        "How does Trample interact with Deathtouch?",
    ],
    "double strike": [
        "How does First Strike work?",
        "How is combat damage assigned with Double Strike?",
    ],
    "priority": [
        "What is the stack?",
        "When can I respond to a spell?",
        "How does priority pass in multiplayer?",
    ],
    "chain": [
        "What is Spell Speed 1?",
        "Can I chain to a Counter Trap?",
        "How does the chain resolve?",
    ],
    "deathtouch": [
        "How does Trample interact with Deathtouch?",
        "What is lethal damage in combat?",
    ],
}


def _rule_path_terms(rule_path: str | None) -> list[str]:
    if not rule_path:
        return []
    return re.findall(r"[A-Za-z]{4,}", rule_path)


def generate_related_questions(
    question: str,
    game_slug: str,
    *,
    rule_applied: str | None = None,
    rule_path: str | None = None,
    rule_atom: str | None = None,
    rule_section: str | None = None,
    limit: int = 3,
) -> list[str]:
    """Gera 2–3 perguntas relacionadas sem chamada LLM (degradação graciosa)."""
    q_lower = question.lower().strip()
    seen: set[str] = set()
    out: list[str] = []

    for keyword, suggestions in _KEYWORD_SUGGESTIONS.items():
        if keyword in q_lower:
            for s in suggestions:
                key = s.lower()
                if key not in seen:
                    seen.add(key)
                    out.append(s)
                if len(out) >= limit:
                    return out[:limit]

    terms = _rule_path_terms(rule_path or rule_applied or rule_atom or rule_section)
    if terms:
        topic = terms[0]
        generic = [
            f"What else does the rules section on {topic} cover?",
            f"Are there exceptions to {topic} in {game_slug.upper()}?",
            f"How is {topic} resolved in tournament play?",
        ]
        for s in generic:
            key = s.lower()
            if key not in seen:
                seen.add(key)
                out.append(s)
            if len(out) >= limit:
                return out[:limit]

    fallbacks = {
        "mtg": [
            "How does the stack work?",
            "What is priority?",
            "How is combat damage assigned?",
        ],
        "yugioh": [
            "How does the chain resolve?",
            "What is Spell Speed?",
            "When can I activate a Quick Effect?",
        ],
        "pokemon": [
            "How does the turn order work?",
            "What is the Prize Cards rule?",
        ],
    }
    for s in fallbacks.get(game_slug, fallbacks["mtg"]):
        key = s.lower()
        if key not in seen:
            seen.add(key)
            out.append(s)
        if len(out) >= limit:
            break

    return out[:limit]
