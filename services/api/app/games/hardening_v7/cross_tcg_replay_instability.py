"""Hardening v7 — instabilidade de replay e timing (soft normalization)."""

from __future__ import annotations

from typing import Any


def _n(tcg: str, topic: str) -> list[str]:
    return [f"{tcg}: {topic} (assistido; sem equivalência forte)."]


def yugioh_segoc_instability_v7_stub(depth: int) -> dict[str, Any]:
    return {"tcg": "yugioh", "depth": depth, "assistant_notes": _n("Yu-Gi-Oh", "SEGOC / chain timing")}


def mtg_multiplayer_pressure_v7_stub(p: int) -> dict[str, Any]:
    return {"tcg": "mtg", "players": p, "assistant_notes": _n("MTG", "pressão multiplayer")}


def fab_combat_chain_drift_v7_stub(layers: int) -> dict[str, Any]:
    return {"tcg": "fab", "layers": layers, "assistant_notes": _n("FAB", "combat chain drift")}


def digimon_resource_divergence_v7_stub(g: int) -> dict[str, Any]:
    return {"tcg": "digimon", "gauge": g, "assistant_notes": _n("Digimon", "resource divergence")}


def onepiece_delayed_effect_drift_v7_stub(step: str) -> dict[str, Any]:
    return {"tcg": "onepiece", "step": step, "assistant_notes": _n("One Piece", "delayed effects")}


def cross_tcg_replay_leakage_guard_v7_stub() -> dict[str, Any]:
    return {"assistant_notes": ["Isolar slices; evitar leakage semântico entre TCGs."]}


def replacement_recursion_pressure_v7_stub(n: int) -> dict[str, Any]:
    return {"tcg": "mtg", "depth": n, "assistant_notes": _n("MTG", "replacement recursion pressure")}
