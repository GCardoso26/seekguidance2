"""Construção de cadeia legível de interações a partir de tags e regras do jogo."""

from __future__ import annotations

import re
from uuid import UUID

from app.games.reasoning_registry import get_precedence_order
from app.retrieval.types import ChunkHit

_TAG_ALIASES: dict[str, tuple[str, ...]] = {
    "event": ("damage", "lose life", "life total", "deal damage", "event"),
    "replacement": ("replacement", "instead", "614"),
    "sba": ("state-based", "sba", "704"),
    "triggered": ("trigger", "603", "triggered ability"),
    "stack": ("stack", "resolve", "spell"),
    "priority": ("priority", "pass priority", "apnap", "active player"),
    "layer": ("layer", "613", "continuous effect", "dependency"),
    "segoc": ("segoc",),
}


def _paths(hits: list[ChunkHit]) -> list[str]:
    return [h.rule_path or "" for h in hits]


def extract_interaction_tags(question: str, hits: list[ChunkHit], game_slug: str) -> list[str]:
    q = (question or "").lower()
    blob = " ".join(_paths(hits))
    found: list[str] = []
    for tag, needles in _TAG_ALIASES.items():
        if any(n in q for n in needles) or any(n in blob for n in needles if len(n) <= 4):
            if tag not in found:
                found.append(tag)
    if game_slug == "yugioh" and (re.search(r"\bsegoc\b", q) or ("chain" in q and "order" in q)):
        if "segoc" not in found:
            found.append("segoc")
    if game_slug == "pokemon" and ("between turns" in q or "simultaneous" in q):
        if "simultaneous_effects" not in found:
            found.append("simultaneous_effects")
    base_order = list(get_precedence_order(game_slug))
    ordered = [t for t in base_order if t in found]
    extra = [t for t in found if t not in ordered and t in ("layer", "segoc")]
    return ordered + extra


def humanize_chain(tags: list[str], game_slug: str) -> list[str]:
    lines: list[str] = []
    for t in tags:
        if t == "replacement":
            lines.append("Replacement effect modifies or replaces the original event.")
        elif t == "sba":
            lines.append("State-based actions are checked after the modified event resolves.")
        elif t == "triggered":
            lines.append("Triggered abilities that became true are put on the stack (APNAP if simultaneous).")
        elif t == "stack":
            lines.append("Stack updates: objects resolve in LIFO order where applicable.")
        elif t == "priority":
            lines.append("Priority passes allow players to respond or proceed.")
        elif t == "event":
            lines.append("Game event occurs (damage, life change, zone change, etc.).")
        elif t == "layer":
            lines.append("Layer system orders continuous effects; dependencies break ties.")
        elif t in ("segoc", "segoc_ordering") and game_slug == "yugioh":
            lines.append("SEGOC: build chain in mandatory-then-optional order for simultaneous triggers.")
        elif t == "activation_window":
            lines.append("Verify activation legality and timing window (spell speed / phase).")
        elif t == "chain_build":
            lines.append("Build chain in order permitted for simultaneous triggers.")
        elif t == "chain_resolution":
            lines.append("Resolve chain from top to bottom (LIFO).")
        elif t == "trigger_timing":
            lines.append("Apply trigger timing rules (missed timing if applicable).")
        elif t == "checkup":
            lines.append("Between-actions / checkup procedures between steps.")
        elif t == "between_turns":
            lines.append("Between-turns effects and simultaneous triggers (owner choice where allowed).")
        elif t == "simultaneous_effects":
            lines.append("Simultaneous effects: order per BCR / rules text.")
        elif t == "replacement_like":
            lines.append("Replacement-like effects alter outcomes before state fixes.")
        elif t == "prize_penalty_recovery":
            lines.append("Prize/penalty and illegal-state recovery per BCR if relevant.")
        elif t == "counter_window":
            lines.append("Counter / response window per game timing.")
        elif t == "resolution":
            lines.append("Resolve pending effects in legal order.")
        elif t == "cost":
            lines.append("Pay costs; illegal cost payment rewinds where rules require.")
        elif t == "effect":
            lines.append("Resolve ability effects in printed order unless modified.")
        elif t == "state_check":
            lines.append("State-based legality checks after effects.")
        elif t == "queue_resolution":
            lines.append("Resolve queued effects / pass priority as per rules.")
        else:
            lines.append(f"Step: {t} ({game_slug}).")
    return lines


def dummy_hit(rule_path: str, text: str = "") -> ChunkHit:
    return ChunkHit(
        chunk_id=UUID(int=0),
        document_id=UUID(int=1),
        text=text,
        rule_path=rule_path,
        semantic_path=None,
        parent_chunk_id=None,
        hierarchy_level=0,
        document_title="CR",
        source_url="https://example.invalid",
        content_sha256=None,
        version_label=None,
        document_content_hash=None,
    )
