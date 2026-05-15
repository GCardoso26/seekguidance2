"""Hardening cross-TCG v6 — divergência e leakage sem equivalência forte."""

from __future__ import annotations

from typing import Any


def _notes(tcg: str, topic: str) -> list[str]:
    return [
        f"{tcg}: {topic} com soft normalization apenas.",
        "Sem equivalência forte entre TCGs; judge assistant apenas.",
    ]


def yugioh_runtime_divergence_v6_stub(load: float) -> dict[str, Any]:
    return {"tcg": "yugioh", "load": load, "assistant_notes": _notes("Yu-Gi-Oh", "divergência de runtime")}


def mtg_multiplayer_instability_v6_stub(players: int) -> dict[str, Any]:
    return {"tcg": "mtg", "players": players, "assistant_notes": _notes("MTG", "instabilidade temporal multiplayer")}


def fab_hidden_dependency_v6_stub(chain_depth: int) -> dict[str, Any]:
    notes = _notes("FAB", "dependências ocultas na combat chain")
    return {"tcg": "fab", "chain_depth": chain_depth, "assistant_notes": notes}


def digimon_memory_pressure_v6_stub(gauge: int) -> dict[str, Any]:
    return {"tcg": "digimon", "gauge": gauge, "assistant_notes": _notes("Digimon", "pressão no memory gauge")}


def onepiece_don_leakage_v6_stub(don: int) -> dict[str, Any]:
    return {"tcg": "onepiece", "don": don, "assistant_notes": _notes("One Piece", "economia DON e leakage de replay")}


def cross_game_replay_leakage_v6_stub() -> dict[str, Any]:
    return {
        "assistant_notes": [
            "Validar isolamento de slices; sem colapsar semânticas entre jogos.",
        ],
        "replay_summary": {"leakage_guard": "soft_only"},
    }


def soft_equivalence_validation_v6_stub() -> dict[str, Any]:
    return {
        "replay_summary": {"strong_equivalence": False},
        "assistant_notes": ["Equivalência apenas soft / assistida."],
    }


def normalization_pressure_v6_stub(score: float) -> dict[str, Any]:
    return {"score": score, "assistant_notes": ["Pressão de normalização observada; juiz valida."]}


def ontology_divergence_v6_stub(delta: float) -> dict[str, Any]:
    return {"delta": delta, "assistant_notes": ["Drift ontológico assistido; explainability-first."]}


def replay_instability_burst_v6_stub(branches: int) -> dict[str, Any]:
    return {"branches": branches, "assistant_notes": ["Instabilidade de ramos; entropy caps recomendados."]}
