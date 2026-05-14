"""Subsistemas semânticos opcionais por TCG (flags, não colapso forçado)."""

from __future__ import annotations

from enum import StrEnum
from typing import Any


class SemanticSubsystem(StrEnum):
    """Vocabulário partilhado; cada jogo ativa apenas o que faz sentido."""

    STACK_SYSTEM = "stack_system"
    CHAIN_SYSTEM = "chain_system"
    TRIGGER_SYSTEM = "trigger_system"
    REPLACEMENT_SYSTEM = "replacement_system"
    STATE_CHECK_SYSTEM = "state_check_system"
    ZONE_TRANSITION_SYSTEM = "zone_transition_system"
    PRIORITY_SYSTEM = "priority_system"
    TIMING_WINDOW_SYSTEM = "timing_window_system"
    COMBAT_CHAIN_SYSTEM = "combat_chain_system"
    MEMORY_GAUGE_SYSTEM = "memory_gauge_system"
    RESOURCE_INK_SYSTEM = "resource_ink_system"
    LORE_PROGRESSION = "lore_progression"
    DON_COUNTER_MOD = "don_counter_mod"
    CUSTOM_ADAPTER = "custom_adapter"


def game_semantic_capabilities(game_slug: str) -> dict[str, Any]:
    """Mapa de subsistemas suportados + notas curtas (reasoning / retrieval tuning)."""
    g = game_slug.strip().lower()
    profiles: dict[str, dict[str, Any]] = {
        "mtg": {
            "active": [
                SemanticSubsystem.STACK_SYSTEM,
                SemanticSubsystem.STATE_CHECK_SYSTEM,
                SemanticSubsystem.REPLACEMENT_SYSTEM,
                SemanticSubsystem.TRIGGER_SYSTEM,
                SemanticSubsystem.PRIORITY_SYSTEM,
                SemanticSubsystem.TIMING_WINDOW_SYSTEM,
                SemanticSubsystem.ZONE_TRANSITION_SYSTEM,
            ],
            "notes": "CR stack + SBA + APNAP; replacement precedence via layers.",
        },
        "yugioh": {
            "active": [
                SemanticSubsystem.CHAIN_SYSTEM,
                SemanticSubsystem.TRIGGER_SYSTEM,
                SemanticSubsystem.TIMING_WINDOW_SYSTEM,
                SemanticSubsystem.ZONE_TRANSITION_SYSTEM,
            ],
            "notes": "SEGOC / chain blocking; timing references distintos de MTG.",
        },
        "pokemon": {
            "active": [
                SemanticSubsystem.PRIORITY_SYSTEM,
                SemanticSubsystem.ZONE_TRANSITION_SYSTEM,
                SemanticSubsystem.TRIGGER_SYSTEM,
            ],
            "notes": "Prioridade simplificada; prémios e LBS como zonas especiais.",
        },
        "onepiece": {
            "active": [
                SemanticSubsystem.DON_COUNTER_MOD,
                SemanticSubsystem.TIMING_WINDOW_SYSTEM,
                SemanticSubsystem.ZONE_TRANSITION_SYSTEM,
            ],
            "notes": "DON!! e janelas de timing específicas do OPTCG.",
        },
        "digimon": {
            "active": [
                SemanticSubsystem.MEMORY_GAUGE_SYSTEM,
                SemanticSubsystem.ZONE_TRANSITION_SYSTEM,
                SemanticSubsystem.TRIGGER_SYSTEM,
            ],
            "notes": "Memory gauge e evolução como transições de estado.",
        },
        "fab": {
            "active": [
                SemanticSubsystem.COMBAT_CHAIN_SYSTEM,
                SemanticSubsystem.TIMING_WINDOW_SYSTEM,
                SemanticSubsystem.ZONE_TRANSITION_SYSTEM,
            ],
            "notes": "Combat chain + floating layers FAB-specific.",
        },
        "lorcana": {
            "active": [
                SemanticSubsystem.RESOURCE_INK_SYSTEM,
                SemanticSubsystem.LORE_PROGRESSION,
                SemanticSubsystem.ZONE_TRANSITION_SYSTEM,
            ],
            "notes": "Ink / lore semantics; não mapear para stack MTG.",
        },
        "riftbound": {
            "active": [
                SemanticSubsystem.CUSTOM_ADAPTER,
                SemanticSubsystem.ZONE_TRANSITION_SYSTEM,
                SemanticSubsystem.TIMING_WINDOW_SYSTEM,
            ],
            "notes": "Ontologia própria; adapters dedicados em `app/games/adapters/riftbound/`.",
        },
    }
    base = profiles.get(
        g,
        {
            "active": [SemanticSubsystem.ZONE_TRANSITION_SYSTEM, SemanticSubsystem.TIMING_WINDOW_SYSTEM],
            "notes": "Perfil genérico até adapters completos.",
        },
    )
    return {
        "game_slug": g,
        "subsystems": [x.value for x in base["active"]],
        "notes": base["notes"],
    }
