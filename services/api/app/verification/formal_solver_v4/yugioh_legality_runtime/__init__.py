"""Yu-Gi-Oh! — legalidade de cadeia (SEGOC/hidden — stub assistente)."""

from __future__ import annotations

from typing import Any


def yugioh_chain_legality_stub(
    *,
    segoc_ok: bool,
    chain_blocks: bool,
    hidden_timing_ok: bool,
) -> dict[str, Any]:
    ok = segoc_ok and not chain_blocks and hidden_timing_ok
    return {
        "ok": ok,
        "assistant_note": "Confirmar SEGOC e bloqueios com CR YGO; não extrapolar para outros TCGs.",
    }
