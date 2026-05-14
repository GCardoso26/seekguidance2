"""Pressão cross-TCG v6 — diagnósticos sem equivalência forte (stubs)."""

from __future__ import annotations

from typing import Any


def _notes(tcg: str, topic: str) -> list[str]:
    return [
        f"{tcg}: {topic} com soft normalization apenas.",
        "Sem equivalência forte entre TCGs; juiz humano decide edge cases.",
    ]


def cross_tcg_runtime_pressure_v2_stub(tcg: str, load: float) -> dict[str, Any]:
    return {
        "tcg": tcg,
        "load": load,
        "assistant_notes": _notes(tcg, "pressão operacional de runtime"),
        "replay_summary": {"pressure": load, "throttle": load > 0.85},
        "deterministic_alignment": {"token": f"ctp-{tcg}"},
    }


def cross_tcg_replay_divergence_stub(tcg_a: str, tcg_b: str) -> dict[str, Any]:
    return {
        "pair": [tcg_a, tcg_b],
        "assistant_notes": _notes(tcg_a, "divergência de replay entre TCGs distintos"),
        "replay_summary": {"divergence_hint": "compare_slices_only"},
    }


def cross_tcg_temporal_drift_stub(tcg: str, skew_ms: int) -> dict[str, Any]:
    return {
        "tcg": tcg,
        "skew_ms": skew_ms,
        "assistant_notes": _notes(tcg, "deriva temporal observada"),
        "deterministic_alignment": {"ordering": "stable_local"},
    }


def cross_tcg_hidden_dependency_runtime_stub(tcg: str) -> dict[str, Any]:
    return {
        "tcg": tcg,
        "assistant_notes": _notes(tcg, "dependências ocultas assistidas"),
        "replay_summary": {"hidden_edges": 1},
    }


def cross_tcg_soft_alignment_runtime_stub(tcg: str) -> dict[str, Any]:
    return {
        "tcg": tcg,
        "assistant_notes": _notes(tcg, "alinhamento soft intra-TCG"),
        "replay_summary": {"alignment": "soft_only"},
    }


def cross_tcg_replay_forecasting_stub(tcg: str) -> dict[str, Any]:
    return {
        "tcg": tcg,
        "assistant_notes": _notes(tcg, "forecast de ramos replay"),
        "replay_summary": {"forecast_entropy": 0.32},
    }


def cross_tcg_runtime_caps_stub(tcg: str, mem_mb: int) -> dict[str, Any]:
    return {
        "tcg": tcg,
        "mem_mb": mem_mb,
        "assistant_notes": _notes(tcg, "caps de runtime cross-contexto"),
        "mobile_constraints": {"cap": 12 if mem_mb < 4096 else 20},
    }


def cross_tcg_equivalence_safety_stub() -> dict[str, Any]:
    return {
        "assistant_notes": [
            "Equivalence safety: bloquear colapsos fortes entre TCGs.",
            "Yu-Gi-Oh / MTG / FAB / Pokémon / One Piece / Digimon / Lorcana / Riftbound: sem unificação semântica.",
        ],
        "replay_summary": {"strong_equivalence": False},
    }
