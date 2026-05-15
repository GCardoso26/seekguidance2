"""Registry central de módulos runtime (capability map)."""

from __future__ import annotations

from typing import Any

# Mapeamento canónico: evita duplicação explosiva V1–V9
_MODULE_REGISTRY: dict[str, dict[str, Any]] = {
    "execution": {"versions": ["v1", "v6", "v9"], "canonical": "runtime_execution_core_v9"},
    "replay": {"versions": ["v6", "v9"], "canonical": "replay_execution_core_v6"},
    "federation": {"versions": ["v6", "v9"], "canonical": "federation_node_registry_v6"},
    "lifecycle": {"versions": ["v7", "v8"], "canonical": "runtime_lifecycle_state_v8"},
    "governance": {"versions": ["v2", "v7"], "canonical": "execution_governance_engine_v2"},
    "openapi_ci": {"versions": ["v2", "v9"], "canonical": "runtime_openapi_enforcement_v9"},
}


def discover_capabilities() -> dict[str, Any]:
    return {
        "modules": len(_MODULE_REGISTRY),
        "domains": list(_MODULE_REGISTRY.keys()),
    }


def runtime_module_registry_v1_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    caps = discover_capabilities()
    return {
        "scope": scope,
        "storage_path": storage_path or "registry",
        "assistant_notes": ["runtime_module_registry_v1: capability discovery v9."],
        "deterministic_alignment": {"token": f"reg-{scope}"},
        "runtime_confidence": 0.9,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {"redundancy_bounded": True},
        "governance_summary": caps,
        "lifecycle_summary": {},
        "operational_notes": [f"domains={caps['domains']}"],
        "capability_summary": caps,
        "compatibility_summary": _MODULE_REGISTRY.get(scope, {}),
    }
