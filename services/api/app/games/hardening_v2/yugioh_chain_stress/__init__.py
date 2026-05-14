"""Yu-Gi-Oh: SEGOC, dependências ocultas, simultâneo (sinais)."""

from __future__ import annotations


def yugioh_segoc_chain_flags(
    *,
    segoc: bool,
    hidden_dep: bool,
    simultaneous: bool,
    chain_illegal: bool,
) -> dict[str, object]:
    return {
        "segoc": segoc,
        "hidden_dependency": hidden_dep,
        "simultaneous": simultaneous,
        "chain_risk": chain_illegal or (segoc and simultaneous),
        "assistant_note": "Validar com CR Yu-Gi-Oh!; não inferir equivalência com outros TCGs.",
    }
