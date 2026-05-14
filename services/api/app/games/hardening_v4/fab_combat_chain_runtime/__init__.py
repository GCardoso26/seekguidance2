"""FAB — combat chain e reaction windows."""

from __future__ import annotations

from typing import Any


def fab_combat_chain_runtime_stub(*, reactions_open: bool, priority_ok: bool) -> dict[str, Any]:
    return {
        "reactions_open": reactions_open,
        "priority_ok": priority_ok,
        "assistant_notes": ["Combat chain legality local; soft normalization."],
    }
