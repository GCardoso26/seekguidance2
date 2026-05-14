"""Validação de combat chain (ex.: FAB) — camada assistente."""

from __future__ import annotations

from typing import Any


def combat_chain_validation_stub(open_reactions: bool, link_depth: int) -> dict[str, Any]:
    return {
        "open_reactions": open_reactions,
        "link_depth": link_depth,
        "legality_reasoning": [
            "Combat chain modelada como sequência de janelas reativas com profundidade limitada.",
        ],
        "proof_steps": [{"step": i + 1, "link": f"L{i}"} for i in range(min(link_depth, 4))],
        "assistant_notes": ["FAB combat chain ≠ stack genérico; não forçar equivalência com outros TCGs."],
        "replay_legality_summary": "Encadeamento coerente com reações abertas/fechadas conforme flags do stub.",
    }
