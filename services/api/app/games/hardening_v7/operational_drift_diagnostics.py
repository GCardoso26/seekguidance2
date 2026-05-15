"""Hardening v7 — drift operacional e pressões de replay (diagnósticos)."""

from __future__ import annotations

from typing import Any


def replay_drift_operational_diagnostic_v7_stub(scope: str) -> dict[str, Any]:
    return {
        "topic": "replay_drift",
        "scope": scope,
        "assistant_notes": ["Drift operacional: comparar lineage; sem equivalência forte entre TCGs."],
    }


def ontology_instability_replay_diagnostic_v7_stub(scope: str) -> dict[str, Any]:
    return {
        "topic": "ontology_instability",
        "scope": scope,
        "assistant_notes": ["Ontologia: supersession e drift explicáveis por TCG."],
    }


def cross_runtime_divergence_diagnostic_v7_stub(scope: str) -> dict[str, Any]:
    return {
        "topic": "cross_runtime_divergence",
        "scope": scope,
        "assistant_notes": ["Divergência edge/cloud: alinhar tokens determinísticos."],
    }


def mobile_offline_degradation_diagnostic_v7_stub(device_id: str) -> dict[str, Any]:
    return {
        "topic": "mobile_offline_degradation",
        "device_id": device_id,
        "assistant_notes": ["Degradação offline: filas e compaction com governança."],
    }


def replay_equivalence_safety_diagnostic_v7_stub(scope: str) -> dict[str, Any]:
    return {
        "topic": "replay_equivalence_safety",
        "scope": scope,
        "assistant_notes": ["Equivalence safety: proibir merge semântico opaco cross-TCG."],
    }


def hidden_dependency_replay_pressure_v7_stub(depth: int) -> dict[str, Any]:
    return {
        "topic": "hidden_dependency_pressure",
        "depth": depth,
        "assistant_notes": ["Hidden dependencies: exposição assistida ao juiz."],
    }


def multiplayer_replay_instability_v7_stub(players: int) -> dict[str, Any]:
    return {
        "topic": "multiplayer_replay_instability",
        "players": players,
        "assistant_notes": ["Multiplayer: traces divergentes reconciliáveis."],
    }
