"""Classificação leve de intenção (keywords + heurísticas); compatível com router LLM futuro."""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum


class QueryIntent(str, Enum):
    gameplay_rules = "gameplay_rules"
    tournament_policy = "tournament_policy"
    penalties = "penalties"
    timing = "timing"
    replacement_effects = "replacement_effects"
    combat = "combat"
    deck_legality = "deck_legality"
    triggered_abilities = "triggered_abilities"
    layers = "layers"
    tournament_procedures = "tournament_procedures"
    temporal_historical = "temporal_historical"
    unknown = "unknown"


@dataclass(frozen=True)
class QueryAnalysis:
    primary: QueryIntent
    secondary: tuple[QueryIntent, ...]
    confidence: float  # heurística 0-1


_HIST = re.compile(
    r"\b(old|previous|formerly|used to|before|historical|legacy|retroactive)\b",
    re.I,
)
_PEN = re.compile(
    r"\b(penalt(y|ies)|ipg|dq|match loss|game loss|warning|upgrade|marked cards|" r"slow play|cheating|stalling)\b",
    re.I,
)
_MTR = re.compile(
    r"\b(mtr|tournament|judge|floor|decklist|registration|pairings|" r"sideboard|presentation|dress)\b",
    re.I,
)
_TIMING = re.compile(
    r"\b(priority|stack|resolve|apnap|step|phase|turn|instant|sorcery speed|" r"hold priority|pass)\b",
    re.I,
)
_REPL = re.compile(r"\b(replacement effect|instead|skip|exile instead)\b", re.I)
_TRIG = re.compile(r"\b(trigger(ed)? abilities?|603\.|goes on the stack)\b", re.I)
_LAY = re.compile(r"\b(layer(s)?|613|continuous effects?|dependency)\b", re.I)
_COMBAT = re.compile(r"\b(combat|block(ing|ers)?|attacker|damage assignment|first strike)\b", re.I)
_DECK = re.compile(r"\b(legal|banned|restricted|deck(check)?|sideboard count)\b", re.I)
_LEGEND = re.compile(r"\b(legend rule|legendary permanents?|planeswalker uniqueness)\b", re.I)


def classify_query(text: str) -> QueryAnalysis:
    t = text.strip()
    sec: list[QueryIntent] = []

    if _HIST.search(t):
        primary = QueryIntent.temporal_historical
        sec.append(QueryIntent.gameplay_rules)
    elif _PEN.search(t):
        primary = QueryIntent.penalties
        sec.extend([QueryIntent.tournament_policy, QueryIntent.tournament_procedures])
    elif _MTR.search(t) and not _TIMING.search(t):
        primary = QueryIntent.tournament_policy
        if _PEN.search(t):
            sec.append(QueryIntent.penalties)
    elif _DECK.search(t):
        primary = QueryIntent.deck_legality
    elif _LAY.search(t):
        primary = QueryIntent.layers
    elif _REPL.search(t):
        primary = QueryIntent.replacement_effects
    elif _TRIG.search(t):
        primary = QueryIntent.triggered_abilities
    elif _COMBAT.search(t):
        primary = QueryIntent.combat
    elif _TIMING.search(t) or _LEGEND.search(t):
        primary = QueryIntent.timing
        if _LEGEND.search(t):
            sec.append(QueryIntent.gameplay_rules)
    elif "how does" in t.lower() or "what is" in t.lower() or "explain" in t.lower():
        primary = QueryIntent.gameplay_rules
    else:
        primary = QueryIntent.unknown

    conf = 0.55
    if primary != QueryIntent.unknown:
        conf = 0.72
    if primary in (QueryIntent.penalties, QueryIntent.temporal_historical, QueryIntent.triggered_abilities):
        conf = min(0.9, conf + 0.08)

    return QueryAnalysis(primary=primary, secondary=tuple(sec), confidence=conf)
