from sdk.python.tcg_runtime import AuthClient, ReplayClient, RuntimeClient


def test_sdk_imports() -> None:
    c = RuntimeClient()
    assert c.base_url.startswith("http")
    assert AuthClient is not None
    assert ReplayClient is not None
