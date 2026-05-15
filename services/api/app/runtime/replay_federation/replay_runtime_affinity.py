"""replay runtime affinity"""

from __future__ import annotations

from typing import Any


def replay_runtime_affinity_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["replay_runtime_affinity_stub: federation-ready; sem K8s/Redis obrigatório."],
        "deterministic_runtime_alignment": {"token": f"dra-{scope}"},
        "replay_cluster_health": {"nominal_stub": True},
        "federation_hints": {"optional_cloud": True},
        "replay_cost_hints": {"bounded": True},
    }
