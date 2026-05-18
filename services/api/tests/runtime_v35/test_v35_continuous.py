import importlib


def test_runtime_v35_imports() -> None:
    mod = importlib.import_module("app.evaluation.continuous_v46")
    assert hasattr(mod, "minimal_runtime_api_regression_v46_stub")
