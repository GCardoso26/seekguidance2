"""Hints de edge/mobile sobre runtimes hardening_v5 existentes (sem equivalência forte)."""

from __future__ import annotations

from typing import Any

from app.games.hardening_v5.digimon_memory_gauge_runtime_v5 import digimon_memory_gauge_runtime_v5_stub
from app.games.hardening_v5.fab_combat_chain_runtime_v5 import fab_combat_chain_runtime_v5_stub
from app.games.hardening_v5.lorcana_lore_progression_runtime import lorcana_lore_progression_runtime_v5_stub
from app.games.hardening_v5.mtg_multiplayer_apnap_runtime import mtg_multiplayer_apnap_runtime_v5_stub
from app.games.hardening_v5.onepiece_don_runtime_semantics import onepiece_don_runtime_semantics_v5_stub
from app.games.hardening_v5.pokemon_delayed_resolution_runtime import pokemon_delayed_resolution_runtime_v5_stub
from app.games.hardening_v5.riftbound_experimental_semantics_runtime import (
    riftbound_experimental_semantics_runtime_v5_stub,
)
from app.games.hardening_v5.yugioh_chain_legality_runtime import yugioh_chain_legality_runtime_v5_stub


def _mobile_edge_wrap(*, tcg: str, runtime_name: str, base: dict[str, Any]) -> dict[str, Any]:
    out = dict(base)
    notes = list(out.get("assistant_notes", []))
    notes.append(f"Mobile-edge: timing simplificado; replay compacto; TCG={tcg}.")
    out["assistant_notes"] = notes
    out["mobile_edge"] = {
        "tcg": tcg,
        "runtime_name": runtime_name,
        "timing_simplified_for_edge": True,
        "replay_compact": True,
        "sync_hints": ["Delta semântico; sem colapsar TCGs diferentes."],
        "offline_legality_warnings": ["Revalidar patch de regras ao voltar online."],
        "deterministic_replay_notes": ["Ordem de eventos preservada no slice exportado."],
        "soft_normalization_only": True,
        "no_strong_cross_tcg_equivalence": True,
    }
    return out


def yugioh_mobile_edge_hints_stub() -> dict[str, Any]:
    return _mobile_edge_wrap(
        tcg="yugioh",
        runtime_name="yugioh_chain_legality_runtime_v5",
        base=yugioh_chain_legality_runtime_v5_stub(),
    )


def mtg_mobile_edge_hints_stub(players: int = 4) -> dict[str, Any]:
    return _mobile_edge_wrap(
        tcg="mtg",
        runtime_name="mtg_multiplayer_apnap_runtime_v5",
        base=mtg_multiplayer_apnap_runtime_v5_stub(players),
    )


def fab_mobile_edge_hints_stub() -> dict[str, Any]:
    return _mobile_edge_wrap(
        tcg="fab",
        runtime_name="fab_combat_chain_runtime_v5",
        base=fab_combat_chain_runtime_v5_stub(),
    )


def pokemon_mobile_edge_hints_stub() -> dict[str, Any]:
    return _mobile_edge_wrap(
        tcg="pokemon",
        runtime_name="pokemon_delayed_resolution_runtime_v5",
        base=pokemon_delayed_resolution_runtime_v5_stub(),
    )


def onepiece_mobile_edge_hints_stub() -> dict[str, Any]:
    return _mobile_edge_wrap(
        tcg="onepiece",
        runtime_name="onepiece_don_runtime_semantics_v5",
        base=onepiece_don_runtime_semantics_v5_stub(),
    )


def digimon_mobile_edge_hints_stub() -> dict[str, Any]:
    return _mobile_edge_wrap(
        tcg="digimon",
        runtime_name="digimon_memory_gauge_runtime_v5",
        base=digimon_memory_gauge_runtime_v5_stub(),
    )


def lorcana_mobile_edge_hints_stub() -> dict[str, Any]:
    return _mobile_edge_wrap(
        tcg="lorcana",
        runtime_name="lorcana_lore_progression_runtime_v5",
        base=lorcana_lore_progression_runtime_v5_stub(),
    )


def riftbound_mobile_edge_hints_stub() -> dict[str, Any]:
    return _mobile_edge_wrap(
        tcg="riftbound",
        runtime_name="riftbound_experimental_semantics_runtime_v5",
        base=riftbound_experimental_semantics_runtime_v5_stub(),
    )
