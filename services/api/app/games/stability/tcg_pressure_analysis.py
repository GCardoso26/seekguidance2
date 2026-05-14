"""Matriz de pressão por TCG (referência operacional, não equivalência mecânica)."""

from __future__ import annotations


def pressure_matrix_stub() -> dict[str, list[str]]:
    return {
        "yugioh": ["chain", "SEGOC", "simultaneous", "mandatory_ordering"],
        "fab": ["combat_chain", "reaction_window", "priority"],
        "pokemon": ["stack_lite", "delayed_effects"],
        "onepiece": ["don_economy", "stateful_resources"],
        "digimon": ["memory_gauge", "inheritance", "evolution_lineage"],
        "lorcana": ["lore_progression", "challenge_timing"],
        "riftbound": ["unknown_abstractions", "ontology_flex"],
    }
