"""Motor incremental de expansão de corpus (fontes + prioridades)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

SourceKind = Literal[
    "official_ruling",
    "comprehensive_rules",
    "errata",
    "release_notes",
    "judge_doc",
    "tournament_policy",
    "penalty_guidelines",
    "judge_forum_archive",
    "official_faq",
    "gameplay_bulletin",
    "interaction_article",
    "replay_archive",
    "tournament_report",
    "investigation_report",
    "historical_snapshot",
]


@dataclass
class CorpusAcquisitionIntent:
    kind: SourceKind
    priority: float
    notes: str | None = None


def default_expansion_intents() -> list[CorpusAcquisitionIntent]:
    """Lista canónica de intenções (URLs reais continuam em `crawler.sources_registry`)."""
    kinds: list[SourceKind] = [
        "official_ruling",
        "comprehensive_rules",
        "errata",
        "release_notes",
        "judge_doc",
        "tournament_policy",
        "penalty_guidelines",
        "judge_forum_archive",
        "official_faq",
        "gameplay_bulletin",
        "interaction_article",
        "replay_archive",
        "tournament_report",
        "investigation_report",
        "historical_snapshot",
    ]
    return [CorpusAcquisitionIntent(k, 1.0 - 0.02 * i) for i, k in enumerate(kinds)]


def expansion_plan_summary(intents: list[CorpusAcquisitionIntent]) -> dict[str, Any]:
    return {"kinds": [i.kind for i in intents], "count": len(intents)}
