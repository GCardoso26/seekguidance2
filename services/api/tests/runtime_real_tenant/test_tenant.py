from app.runtime.runtime_real_tenant.engine import runtime_real_tenant_engine_v1


def test_list_tenants() -> None:
    r = runtime_real_tenant_engine_v1("t")
    assert any(x["tenant_id"] == "default" for x in r["tenants"])
