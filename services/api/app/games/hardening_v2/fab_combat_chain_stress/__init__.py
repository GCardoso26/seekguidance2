"""FAB: combat chain / camadas."""

from __future__ import annotations


def fab_layer_pressure(*, layers: int) -> dict[str, object]:
    return {"pressure": layers > 4, "layers": layers}
