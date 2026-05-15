"""Enterprise product consoles."""
from __future__ import annotations

from app.runtime.product_runtime.runtime_enterprise_admin_console_v1 import (
    runtime_enterprise_admin_console_v1_stub,
)
from app.runtime.product_runtime.runtime_enterprise_support_console_v1 import (
    runtime_enterprise_support_console_v1_stub,
)


def test_admin_console() -> None:
    assert runtime_enterprise_admin_console_v1_stub("pr")["product_score"] > 0


def test_support_console() -> None:
    assert runtime_enterprise_support_console_v1_stub("pr")["product_score"] > 0
