"""Templates de mutação em IR."""

from __future__ import annotations

from typing import Any


def mutation_template(
    mutation_type: str,
    target: str,
    source_effect: str,
    *,
    layer: str | None = None,
    old_value: Any = None,
    new_value: Any = None,
) -> dict[str, Any]:
    return {
        "mutation_type": mutation_type,
        "target_object": target,
        "source_effect": source_effect,
        "layer": layer,
        "old_value": old_value,
        "new_value": new_value,
    }
