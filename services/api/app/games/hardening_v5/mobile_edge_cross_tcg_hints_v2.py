"""Hardening cross-TCG mobile-aware v2 (extensão incremental sobre v1)."""

from __future__ import annotations

from typing import Any

from app.games.hardening_v5.mobile_edge_cross_tcg_hints import (
    digimon_mobile_edge_hints_stub,
    fab_mobile_edge_hints_stub,
    lorcana_mobile_edge_hints_stub,
    mtg_mobile_edge_hints_stub,
    onepiece_mobile_edge_hints_stub,
    pokemon_mobile_edge_hints_stub,
    riftbound_mobile_edge_hints_stub,
    yugioh_mobile_edge_hints_stub,
)


def _v2_envelope(base: dict[str, Any]) -> dict[str, Any]:
    out = dict(base)
    me = dict(out.get("mobile_edge", {}))
    me["v2"] = {
        "replay_compact_v2": True,
        "edge_legality": "hints_only",
        "offline_warnings": ["Revalidar patch de regras ao sync."],
        "timing_degradation": "thermal_and_battery_aware",
        "deterministic_hints": ["stable_event_order_in_exported_slice"],
        "sync_caveats": ["Não auto-merge de ruling", "delta_replay_preferred"],
        "replay_divergence_hints": ["Expor diff curto se heads divergirem"],
    }
    out["mobile_edge"] = me
    notes = list(out.get("assistant_notes", []))
    notes.append("mobile_edge v2: endurecimento operacional sem equivalência forte cross-TCG.")
    out["assistant_notes"] = notes
    return out


def yugioh_mobile_edge_hints_v2_stub() -> dict[str, Any]:
    return _v2_envelope(yugioh_mobile_edge_hints_stub())


def mtg_mobile_edge_hints_v2_stub(players: int = 4) -> dict[str, Any]:
    return _v2_envelope(mtg_mobile_edge_hints_stub(players))


def fab_mobile_edge_hints_v2_stub() -> dict[str, Any]:
    return _v2_envelope(fab_mobile_edge_hints_stub())


def pokemon_mobile_edge_hints_v2_stub() -> dict[str, Any]:
    return _v2_envelope(pokemon_mobile_edge_hints_stub())


def onepiece_mobile_edge_hints_v2_stub() -> dict[str, Any]:
    return _v2_envelope(onepiece_mobile_edge_hints_stub())


def digimon_mobile_edge_hints_v2_stub() -> dict[str, Any]:
    return _v2_envelope(digimon_mobile_edge_hints_stub())


def lorcana_mobile_edge_hints_v2_stub() -> dict[str, Any]:
    return _v2_envelope(lorcana_mobile_edge_hints_stub())


def riftbound_mobile_edge_hints_v2_stub() -> dict[str, Any]:
    return _v2_envelope(riftbound_mobile_edge_hints_stub())
