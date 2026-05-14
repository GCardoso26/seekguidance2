"""Bundle de regressão contínua."""

from __future__ import annotations

from typing import Any


def continuous_regression_bundle(**parts: Any) -> dict[str, Any]:
    return {"tracks": sorted(parts.keys()), "values": parts}
