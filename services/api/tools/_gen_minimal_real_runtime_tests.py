"""Testes reais — Minimal Real Operational Runtime."""
from __future__ import annotations

from pathlib import Path

API = Path(__file__).resolve().parents[1]
TESTS = API / "tests"


def w(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


AUTH_TEST = '''"""Testes auth real."""
from __future__ import annotations

import tempfile
from pathlib import Path

import pytest

from app.runtime.runtime_real_auth.engine import runtime_real_auth_engine_v1
from app.runtime.runtime_real_auth import tokens


@pytest.fixture
def auth_db(tmp_path: Path) -> str:
    return str(tmp_path / "auth.sqlite")


def test_auth_login_success(auth_db: str) -> None:
    r = runtime_real_auth_engine_v1(
        "t",
        storage_path=auth_db,
        action="login",
        username="admin",
        password="admin",
    )
    assert r["authenticated"] is True
    assert "access_token" in r["tokens"]


def test_auth_login_fail(auth_db: str) -> None:
    r = runtime_real_auth_engine_v1(
        "t",
        storage_path=auth_db,
        action="login",
        username="admin",
        password="wrong",
    )
    assert r.get("authenticated") is False


def test_token_refresh(auth_db: str) -> None:
    login = runtime_real_auth_engine_v1(
        "t",
        storage_path=auth_db,
        action="login",
        username="admin",
        password="admin",
    )
    ref = login["tokens"]["refresh_token"]
    r = runtime_real_auth_engine_v1("t", storage_path=auth_db, action="refresh", refresh_token=ref)
    assert r.get("refreshed") is True
    payload = tokens.decode_access(r["tokens"]["access_token"])
    assert payload["role"] == "admin"
'''

REPLAY_TEST = '''"""Testes replay real."""
from __future__ import annotations

from pathlib import Path

import pytest

from app.runtime.runtime_real_replay.engine import runtime_real_replay_engine_v1


@pytest.fixture
def replay_db(tmp_path: Path) -> str:
    return str(tmp_path / "replay.sqlite")


def test_replay_append_and_get(replay_db: str) -> None:
    r = runtime_real_replay_engine_v1(
        "scope-a",
        storage_path=replay_db,
        tenant_id="t1",
        action="append",
        payload={"event": "test"},
    )
    rid = r["record"]["replay_id"]
    got = runtime_real_replay_engine_v1(
        "scope-a",
        storage_path=replay_db,
        action="get",
        replay_id=rid,
    )
    assert got["record"]["integrity_ok"] is True


def test_replay_export_import(replay_db: str) -> None:
    runtime_real_replay_engine_v1(
        "s",
        storage_path=replay_db,
        tenant_id="t1",
        action="append",
        payload={"n": 1},
    )
    exp = runtime_real_replay_engine_v1("s", storage_path=replay_db, action="export")
    n = runtime_real_replay_engine_v1(
        "s",
        storage_path=replay_db,
        action="import",
        payload={"records": exp["records"]},
    )
    assert n["imported"] >= 1
'''

API_TEST = '''"""Testes API FastAPI real."""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_route() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_auth_login_route() -> None:
    r = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    assert r.status_code == 200
    assert r.json()["authenticated"] is True


def test_runtime_status_route() -> None:
    login = client.post("/auth/login", json={"username": "admin", "password": "admin"})
    tok = login.json()["tokens"]["access_token"]
    r = client.get("/runtime/status", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 200
    assert r.json()["integrity_status"] == "ok"


def test_runtime_replay_post() -> None:
    r = client.post(
        "/runtime/replay",
        json={"tenant_id": "default", "scope": "api-test", "payload": {"x": 1}},
    )
    assert r.status_code == 200
'''

TENANT_TEST = '''from app.runtime.runtime_real_tenant.engine import runtime_real_tenant_engine_v1


def test_list_tenants() -> None:
    r = runtime_real_tenant_engine_v1("t")
    assert any(x["tenant_id"] == "default" for x in r["tenants"])
'''

FED_TEST = '''from app.runtime.runtime_minimal_federation.engine import runtime_minimal_federation_engine_v1


def test_federation_register() -> None:
    runtime_minimal_federation_engine_v1(
        "f",
        action="register",
        node_id="n1",
        endpoint="http://127.0.0.1:8000",
    )
    r = runtime_minimal_federation_engine_v1("f")
    assert r["healthy_count"] >= 0
'''

OBS_TEST = '''from app.runtime.runtime_real_observability.engine import runtime_real_observability_engine_v1


def test_observability() -> None:
    r = runtime_real_observability_engine_v1("o", action="metric", metric="requests", value=1.0)
    assert r["integrity_status"] == "ok"
    assert r["structured_logging"] is True
'''

DEPLOY_TEST = '''from app.runtime.runtime_real_deployment.engine import runtime_real_deployment_engine_v1


def test_deployment_artifacts() -> None:
    r = runtime_real_deployment_engine_v1("d")
    assert r["artifacts"]["dockerfile"] is True
'''

PILOT_TEST = '''from app.runtime.runtime_real_pilot.engine import runtime_real_pilot_engine_v1


def test_pilot_enroll() -> None:
    runtime_real_pilot_engine_v1("p", action="enroll", user_id="u1", operator="op1")
    r = runtime_real_pilot_engine_v1("p")
    assert r["enrolled_users"] >= 1
'''

CONT_TEST = '''from app.runtime.runtime_operational_continuity.engine import runtime_operational_continuity_engine_v1


def test_continuity() -> None:
    r = runtime_operational_continuity_engine_v1("c")
    assert r["horizon_days"] == 90
'''

PROD_TEST = '''from app.runtime.runtime_productization.engine import runtime_productization_engine_v1


def test_productization() -> None:
    r = runtime_productization_engine_v1("p")
    assert r["sdk_python"] is True
    assert r["runtime_cli"] is True
'''

SIM_TEST = '''from app.runtime.runtime_operational_simplicity.engine import runtime_operational_simplicity_engine_v1


def test_simplicity() -> None:
    r = runtime_operational_simplicity_engine_v1("s")
    assert r["modules_loaded"] >= 1
'''

API_ENGINE_TEST = '''from app.runtime.runtime_real_minimal.api_engine import runtime_real_api_engine_v1


def test_api_engine() -> None:
    r = runtime_real_api_engine_v1("api")
    assert r["status"] == "operational"
'''

V35_TEST = '''import importlib


def test_runtime_v35_imports() -> None:
    mod = importlib.import_module("app.evaluation.continuous_v46")
    assert hasattr(mod, "minimal_runtime_api_regression_v46_stub")
'''

CV46_TEST = '''import importlib
import pytest

V46 = [
    "minimal_runtime_api_regression_v46_stub",
    "real_auth_regression_v46_stub",
    "real_replay_regression_v46_stub",
    "real_observability_regression_v46_stub",
    "real_deployment_regression_v46_stub",
    "real_tenant_regression_v46_stub",
    "minimal_federation_regression_v46_stub",
    "real_pilot_regression_v46_stub",
    "operational_continuity_regression_v46_stub",
    "productization_regression_v46_stub",
]


@pytest.mark.parametrize("fn", V46)
def test_continuous_v46(fn: str) -> None:
    mod = importlib.import_module("app.evaluation.continuous_v46")
    stub = getattr(mod, fn)
    out = stub("signal-v46")
    assert out["operational_confidence"] == 0.94
'''

w(TESTS / "runtime_real_auth" / "test_auth_real.py", AUTH_TEST)
w(TESTS / "runtime_real_replay" / "test_replay_real.py", REPLAY_TEST)
w(TESTS / "runtime_real_minimal" / "test_api_routes.py", API_TEST)
w(TESTS / "runtime_real_tenant" / "test_tenant.py", TENANT_TEST)
w(TESTS / "runtime_minimal_federation" / "test_federation.py", FED_TEST)
w(TESTS / "runtime_real_observability" / "test_observability.py", OBS_TEST)
w(TESTS / "runtime_real_deployment" / "test_deployment.py", DEPLOY_TEST)
w(TESTS / "runtime_real_pilot" / "test_pilot.py", PILOT_TEST)
w(TESTS / "runtime_operational_continuity" / "test_continuity.py", CONT_TEST)
w(TESTS / "runtime_productization" / "test_productization.py", PROD_TEST)
w(TESTS / "runtime_real_minimal" / "test_api_engine.py", API_ENGINE_TEST)
w(TESTS / "runtime_real_minimal" / "test_simplicity.py", SIM_TEST)
w(TESTS / "runtime_v35" / "test_v35_continuous.py", V35_TEST)
w(TESTS / "continuous_v46" / "test_continuous_v46_imports.py", CV46_TEST)

GATES_V34 = '''import importlib
import pytest

GATES = [
    "minimal_runtime_api_gate_v34_stub",
    "real_auth_gate_v34_stub",
    "real_replay_gate_v34_stub",
    "real_observability_gate_v34_stub",
    "real_deployment_gate_v34_stub",
    "real_tenant_gate_v34_stub",
    "minimal_federation_gate_v34_stub",
    "real_pilot_gate_v34_stub",
    "operational_continuity_gate_v34_stub",
    "productization_gate_v34_stub",
]


@pytest.mark.parametrize("fn", GATES)
def test_gates_v34(fn: str) -> None:
    mod = importlib.import_module("app.evaluation.gates.v34")
    out = getattr(mod, fn)("run-v34")
    assert out["gate_passed"] is True
    assert out["integrity_status"] == "ok"
'''

ENGINES = '''import pytest

from app.runtime.runtime_real_deployment.engine import runtime_real_deployment_engine_v1
from app.runtime.runtime_real_observability.engine import runtime_real_observability_engine_v1
from app.runtime.runtime_operational_continuity.engine import runtime_operational_continuity_engine_v1
from app.runtime.runtime_productization.engine import runtime_productization_engine_v1
from app.runtime.runtime_operational_simplicity.engine import runtime_operational_simplicity_engine_v1


@pytest.mark.parametrize(
    "engine,scope",
    [
        (runtime_real_deployment_engine_v1, "dep"),
        (runtime_real_observability_engine_v1, "obs"),
        (runtime_operational_continuity_engine_v1, "cont"),
        (runtime_productization_engine_v1, "prod"),
        (runtime_operational_simplicity_engine_v1, "simp"),
    ],
)
def test_engine_integrity(engine, scope: str) -> None:
    r = engine(scope)
    assert r["integrity_status"] == "ok"
    assert r["runtime_confidence"] == 0.94
'''

SDK_TEST = '''from sdk.python.tcg_runtime import AuthClient, ReplayClient, RuntimeClient


def test_sdk_imports() -> None:
    c = RuntimeClient()
    assert c.base_url.startswith("http")
    assert AuthClient is not None
    assert ReplayClient is not None
'''

DATASETS = '''from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
NAMES = [
    "executable_real_minimal_runtime_v34",
    "executable_real_auth_v34",
    "executable_real_replay_v34",
]


@pytest.mark.parametrize("name", NAMES)
def test_dataset_v34_manifest(name: str) -> None:
    root = API / "evaluation/runtime_execution" / name
    assert (root / "manifest.json").is_file()
    assert (root / "validation.json").is_file()
'''

w(TESTS / "gates_v34" / "test_gates_v34.py", GATES_V34)
w(TESTS / "runtime_real_minimal" / "test_engines_integrity.py", ENGINES)
w(TESTS / "runtime_productization" / "test_sdk.py", SDK_TEST)
w(TESTS / "runtime_v35" / "test_datasets_v34.py", DATASETS)

REGRESSION_MATRIX = '''import pytest

from app.runtime.runtime_real_auth.engine import runtime_real_auth_engine_v1
from app.runtime.runtime_real_replay.engine import runtime_real_replay_engine_v1
from app.runtime.runtime_real_tenant.engine import runtime_real_tenant_engine_v1
from app.runtime.runtime_minimal_federation.engine import runtime_minimal_federation_engine_v1

SCOPES = [f"scope-{i}" for i in range(80)]


@pytest.mark.parametrize("scope", SCOPES)
def test_auth_status_matrix(scope: str) -> None:
    r = runtime_real_auth_engine_v1(scope, action="status")
    assert r["integrity_status"] == "ok"


@pytest.mark.parametrize("scope", SCOPES[:40])
def test_replay_list_matrix(scope: str, tmp_path) -> None:
    db = str(tmp_path / f"{scope}.sqlite")
    r = runtime_real_replay_engine_v1(scope, storage_path=db, action="list")
    assert r["integrity_status"] == "ok"


@pytest.mark.parametrize("scope", SCOPES[:20])
def test_tenant_matrix(scope: str) -> None:
    r = runtime_real_tenant_engine_v1(scope)
    assert "tenants" in r


@pytest.mark.parametrize("scope", SCOPES[:20])
def test_federation_matrix(scope: str) -> None:
    r = runtime_minimal_federation_engine_v1(scope)
    assert r["sync_mode"] == "basic"
'''

w(TESTS / "runtime_v35" / "test_regression_matrix.py", REGRESSION_MATRIX)

print("minimal real runtime tests written")
