"""Hardening cross-TCG v5 (diagnósticos + runtimes avançados, soft normalization)."""

from app.games.hardening_v5.digimon_memory_gauge_runtime_v5 import digimon_memory_gauge_runtime_v5_stub
from app.games.hardening_v5.fab_combat_chain_runtime_v5 import fab_combat_chain_runtime_v5_stub
from app.games.hardening_v5.fab_reaction_window_runtime import fab_reaction_window_runtime_v5_stub
from app.games.hardening_v5.lorcana_lore_progression_runtime import lorcana_lore_progression_runtime_v5_stub
from app.games.hardening_v5.mtg_multiplayer_apnap_runtime import mtg_multiplayer_apnap_runtime_v5_stub
from app.games.hardening_v5.mtg_replacement_runtime import mtg_replacement_runtime_v5_stub
from app.games.hardening_v5.mtg_sba_dependency_runtime import mtg_sba_dependency_runtime_v5_stub
from app.games.hardening_v5.normalization_leak_diagnostics import normalization_leak_diagnostics_v5_stub
from app.games.hardening_v5.onepiece_don_runtime_semantics import onepiece_don_runtime_semantics_v5_stub
from app.games.hardening_v5.ontology_inconsistency_diagnostics import ontology_inconsistency_diagnostics_v5_stub
from app.games.hardening_v5.pokemon_delayed_resolution_runtime import pokemon_delayed_resolution_runtime_v5_stub
from app.games.hardening_v5.riftbound_experimental_semantics_runtime import (
    riftbound_experimental_semantics_runtime_v5_stub,
)
from app.games.hardening_v5.runtime_divergence_diagnostics import runtime_divergence_diagnostics_v5_stub
from app.games.hardening_v5.temporal_inconsistency_diagnostics import temporal_inconsistency_diagnostics_v5_stub
from app.games.hardening_v5.yugioh_chain_legality_runtime import yugioh_chain_legality_runtime_v5_stub
from app.games.hardening_v5.yugioh_hidden_dependency_runtime import yugioh_hidden_dependency_runtime_v5_stub
from app.games.hardening_v5.yugioh_segoc_runtime import yugioh_segoc_runtime_v5_stub
from app.games.hardening_v5.yugioh_simultaneous_timing_runtime import yugioh_simultaneous_timing_runtime_v5_stub

__all__ = [
    "digimon_memory_gauge_runtime_v5_stub",
    "fab_combat_chain_runtime_v5_stub",
    "fab_reaction_window_runtime_v5_stub",
    "lorcana_lore_progression_runtime_v5_stub",
    "mtg_multiplayer_apnap_runtime_v5_stub",
    "mtg_replacement_runtime_v5_stub",
    "mtg_sba_dependency_runtime_v5_stub",
    "normalization_leak_diagnostics_v5_stub",
    "onepiece_don_runtime_semantics_v5_stub",
    "ontology_inconsistency_diagnostics_v5_stub",
    "pokemon_delayed_resolution_runtime_v5_stub",
    "riftbound_experimental_semantics_runtime_v5_stub",
    "runtime_divergence_diagnostics_v5_stub",
    "temporal_inconsistency_diagnostics_v5_stub",
    "yugioh_chain_legality_runtime_v5_stub",
    "yugioh_hidden_dependency_runtime_v5_stub",
    "yugioh_segoc_runtime_v5_stub",
    "yugioh_simultaneous_timing_runtime_v5_stub",
]
