"""FAB — legalidade de combat chain (stub)."""

from __future__ import annotations

from typing import Any


def fab_combat_chain_legality_stub(*, reactions_open: bool, layer_ok: bool) -> dict[str, Any]:
    return {
        "ok": reactions_open and layer_ok,
        "assistant_note": "Combat chain FAB é local; validar janelas de reação oficiais.",
    }
