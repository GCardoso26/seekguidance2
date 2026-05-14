"""Expansão lexical conservadora (sinónimos MTG) para FTS — sem reescrever a pergunta."""

from __future__ import annotations

from app.query_understanding.intent_classifier import QueryIntent

_SYNONYMS: dict[QueryIntent, tuple[str, ...]] = {
    QueryIntent.timing: ("priority", "APNAP", "stack", "steps", "phases"),
    QueryIntent.triggered_abilities: ("trigger", "603", "stack", "controlled"),
    QueryIntent.replacement_effects: ("replacement", "instead", "614"),
    QueryIntent.penalties: ("IPG", "infraction", "penalty", "MTR"),
    QueryIntent.tournament_policy: ("MTR", "tournament", "policy", "floor"),
    QueryIntent.combat: ("combat", "damage", "blocking", "attacking"),
    QueryIntent.layers: ("613", "continuous effects", "dependencies"),
    QueryIntent.deck_legality: ("deck", "legal", "banned", "restricted"),
    QueryIntent.temporal_historical: ("previous", "rules", "comprehensive"),
}


def expand_lexical_query(question: str, primary: QueryIntent) -> str:
    """Anexa poucos termos canónicos para melhorar recall lexical sem alterar semântica da pergunta."""
    extra = _SYNONYMS.get(primary, ())
    if not extra:
        return question.strip()
    tail = " ".join(extra[:4])
    return f"{question.strip()} {tail}"
