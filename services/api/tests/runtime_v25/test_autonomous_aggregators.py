"""runtime v25 aggregators."""
from app.runtime.public_runtime_api.runtime_public_ecosystem_maturity_engine_v2 import (
    runtime_public_ecosystem_maturity_engine_v2,
)
from app.runtime.runtime_autonomous_governance.runtime_autonomous_governance_engine_v1 import (
    runtime_autonomous_governance_engine_v1,
)
from app.runtime.runtime_control_plane.runtime_control_plane_engine_v1 import runtime_control_plane_engine_v1
from app.runtime.runtime_federated_intelligence.runtime_federated_intelligence_engine_v1 import (
    runtime_federated_intelligence_engine_v1,
)
from app.runtime.runtime_operational_autotuning.runtime_operational_autotuning_engine_v1 import (
    runtime_operational_autotuning_engine_v1,
)
from app.runtime.runtime_policy_coordination.runtime_policy_coordination_engine_v1 import (
    runtime_policy_coordination_engine_v1,
)
from app.runtime.runtime_reliability.runtime_long_horizon_reliability_engine_v1 import (
    runtime_long_horizon_reliability_engine_v1,
)
from app.runtime.runtime_self_healing.runtime_self_healing_engine_v1 import runtime_self_healing_engine_v1


def test_v25_autgov() -> None:
    assert runtime_autonomous_governance_engine_v1("v25")["governance_score"] > 0


def test_v25_policy() -> None:
    assert runtime_policy_coordination_engine_v1("v25")["policy_score"] > 0


def test_v25_tune() -> None:
    assert runtime_operational_autotuning_engine_v1("v25")["autotuning_score"] > 0


def test_v25_fed() -> None:
    assert runtime_federated_intelligence_engine_v1("v25")["federation_score"] > 0


def test_v25_lh() -> None:
    assert runtime_long_horizon_reliability_engine_v1("v25")["long_horizon_score"] > 0


def test_v25_heal() -> None:
    assert runtime_self_healing_engine_v1("v25")["healing_score"] > 0


def test_v25_cp() -> None:
    assert runtime_control_plane_engine_v1("v25")["control_plane_score"] > 0


def test_v25_pub() -> None:
    assert runtime_public_ecosystem_maturity_engine_v2("v25")["ecosystem_maturity_score"] > 0
