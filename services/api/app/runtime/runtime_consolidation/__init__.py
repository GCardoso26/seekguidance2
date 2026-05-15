"""runtime_consolidation."""
from __future__ import annotations

from .canonical_execution_registry_v1 import canonical_execution_registry_v1_stub
from .canonical_execution_runtime_engine_v2 import canonical_execution_runtime_engine_v2_stub
from .canonical_federation_registry_v1 import canonical_federation_registry_v1_stub
from .canonical_federation_supervisor_v2 import canonical_federation_supervisor_v2_stub
from .canonical_governance_engine_v1 import canonical_governance_engine_v1_stub
from .canonical_governance_engine_v2 import canonical_governance_engine_v2_stub
from .canonical_observability_bridge_v2 import canonical_observability_bridge_v2_stub
from .canonical_observability_registry_v1 import canonical_observability_registry_v1_stub
from .canonical_persistence_interface_v1 import canonical_persistence_interface_v1_stub
from .canonical_persistence_interface_v2 import canonical_persistence_interface_v2_stub
from .canonical_runtime_alignment_engine_v2 import canonical_runtime_alignment_engine_v2_stub
from .canonical_runtime_capabilities_v2 import canonical_runtime_capabilities_v2_stub
from .canonical_runtime_health_engine_v2 import canonical_runtime_health_engine_v2_stub
from .canonical_runtime_registry_v2 import canonical_runtime_registry_v2_stub
from .canonical_runtime_summary_v2 import canonical_runtime_summary_v2_stub
from .runtime_capability_aggregation_v1 import runtime_capability_aggregation_v1_stub
from .runtime_compatibility_registry_v1 import runtime_compatibility_registry_v1_stub
from .runtime_execution_normalization_v1 import runtime_execution_normalization_v1_stub
from .runtime_payload_normalization_v1 import runtime_payload_normalization_v1_stub
from .runtime_scoring_normalization_v1 import runtime_scoring_normalization_v1_stub

__all__ = [
    "canonical_execution_registry_v1_stub",
    "canonical_federation_registry_v1_stub",
    "canonical_observability_registry_v1_stub",
    "canonical_persistence_interface_v1_stub",
    "canonical_governance_engine_v1_stub",
    "runtime_compatibility_registry_v1_stub",
    "runtime_capability_aggregation_v1_stub",
    "runtime_execution_normalization_v1_stub",
    "runtime_scoring_normalization_v1_stub",
    "runtime_payload_normalization_v1_stub",    "canonical_execution_runtime_engine_v2_stub",
    "canonical_federation_supervisor_v2_stub",
    "canonical_observability_bridge_v2_stub",
    "canonical_persistence_interface_v2_stub",
    "canonical_governance_engine_v2_stub",
    "canonical_runtime_registry_v2_stub",
    "canonical_runtime_health_engine_v2_stub",
    "canonical_runtime_alignment_engine_v2_stub",
    "canonical_runtime_summary_v2_stub",
    "canonical_runtime_capabilities_v2_stub",

]
