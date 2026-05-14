"""Hardening V3 por TCG (runtime local, soft normalization)."""

from app.games.hardening_v3.digimon_memory_drift_runtime import digimon_memory_drift_runtime_stub
from app.games.hardening_v3.digimon_memory_runtime import digimon_inherited_timing_stub
from app.games.hardening_v3.fab_combat_runtime import fab_combat_runtime_stub
from app.games.hardening_v3.fab_reaction_runtime import fab_reaction_recursion_stub
from app.games.hardening_v3.fab_reaction_window_runtime import fab_reaction_window_instability_stub
from app.games.hardening_v3.lorcana_lore_progression_runtime import lorcana_lore_progression_runtime_stub
from app.games.hardening_v3.lorcana_lore_runtime import lorcana_exert_sequencing_stub
from app.games.hardening_v3.mtg_apnap_runtime import mtg_apnap_runtime_stub
from app.games.hardening_v3.mtg_multiplayer_runtime import mtg_apnap_loop_stub
from app.games.hardening_v3.onepiece_don_runtime import onepiece_don_runtime_stub
from app.games.hardening_v3.onepiece_don_state_runtime import onepiece_don_state_runtime_stub
from app.games.hardening_v3.onepiece_resource_runtime import onepiece_don_sequencing_stub
from app.games.hardening_v3.pokemon_delayed_effects import pokemon_delayed_effects_stub
from app.games.hardening_v3.pokemon_delayed_resolution_runtime import pokemon_delayed_resolution_runtime_stub
from app.games.hardening_v3.riftbound_experimental_runtime import riftbound_experimental_runtime_stub
from app.games.hardening_v3.riftbound_unknown_runtime import riftbound_semantic_injection_stub
from app.games.hardening_v3.riftbound_unknown_semantics_runtime import riftbound_unknown_semantics_runtime_stub
from app.games.hardening_v3.yugioh_hidden_dependency_runtime import (
    runtime_divergence_diagnostic_stub,
    yugioh_segoc_edge_stub,
)
from app.games.hardening_v3.yugioh_segoc_runtime import yugioh_segoc_runtime_stub

__all__ = [
    "digimon_inherited_timing_stub",
    "digimon_memory_drift_runtime_stub",
    "fab_combat_runtime_stub",
    "fab_reaction_recursion_stub",
    "fab_reaction_window_instability_stub",
    "lorcana_exert_sequencing_stub",
    "lorcana_lore_progression_runtime_stub",
    "mtg_apnap_loop_stub",
    "mtg_apnap_runtime_stub",
    "onepiece_don_runtime_stub",
    "onepiece_don_sequencing_stub",
    "onepiece_don_state_runtime_stub",
    "pokemon_delayed_effects_stub",
    "pokemon_delayed_resolution_runtime_stub",
    "riftbound_experimental_runtime_stub",
    "riftbound_semantic_injection_stub",
    "riftbound_unknown_semantics_runtime_stub",
    "runtime_divergence_diagnostic_stub",
    "yugioh_segoc_edge_stub",
    "yugioh_segoc_runtime_stub",
]
