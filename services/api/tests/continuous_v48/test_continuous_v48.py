import importlib

import pytest

V48 = ["runtime_console_ui_regression_v48_stub", "runtime_mobile_ui_regression_v48_stub"]
@pytest.mark.parametrize("fn", V48)
def test_v48(fn: str):
    mod = importlib.import_module("app.evaluation.continuous_v48")
    assert getattr(mod, fn)("s")["operational_confidence"] == 0.94
