"""Perfis de confiança por jogo (pesos, limiares UI, contagem de fontes)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ConfidenceProfile:
    """Pesos da fórmula (soma ≈ 1.0 antes do multiplicador anchor)."""

    w_overlap: float = 0.20
    w_fused: float = 0.15
    w_top1: float = 0.22
    w_rerank: float = 0.22
    w_spread: float = 0.10
    w_sources: float = 0.11
    fused_scale: float = 1.2
    source_divisor: float = 3.0
    anchor_floor: float = 0.70
    ui_notice_threshold: float = 0.42
    use_rule_path_sources: bool = True


_DEFAULT = ConfidenceProfile()

# Corpus único / EN vs perguntas PT — menos peso em overlap vetor↔lexical
_MTG = ConfidenceProfile(
    w_overlap=0.10,
    w_fused=0.14,
    w_top1=0.30,
    w_rerank=0.22,
    w_spread=0.10,
    w_sources=0.14,
    fused_scale=1.25,
    source_divisor=2.0,
    anchor_floor=0.78,
    ui_notice_threshold=0.40,
)

# Regras numeradas extensas (estrutura semelhante ao MTG)
_STRUCTURED = ConfidenceProfile(
    w_overlap=0.14,
    w_fused=0.15,
    w_top1=0.26,
    w_rerank=0.22,
    w_spread=0.10,
    w_sources=0.13,
    fused_scale=1.22,
    source_divisor=2.5,
    anchor_floor=0.75,
    ui_notice_threshold=0.41,
)

_PROFILES: dict[str, ConfidenceProfile] = {
    "mtg": _MTG,
    "pokemon": _STRUCTURED,
    "yugioh": _STRUCTURED,
    "lorcana": _STRUCTURED,
    "onepiece": ConfidenceProfile(
        w_overlap=0.16,
        w_fused=0.16,
        w_top1=0.24,
        w_rerank=0.22,
        w_spread=0.10,
        w_sources=0.12,
        ui_notice_threshold=0.42,
    ),
    "fab": _STRUCTURED,
    "digimon": _DEFAULT,
    "dbfw": _DEFAULT,
    "gundam": _DEFAULT,
    "sorcery": _DEFAULT,
    "vanguard": _STRUCTURED,
    "riftbound": _DEFAULT,
    "union_arena": _DEFAULT,
}


def get_confidence_profile(game_slug: str | None) -> ConfidenceProfile:
    if not game_slug:
        return _DEFAULT
    return _PROFILES.get(game_slug.strip().lower(), _DEFAULT)
