"""Cold-start warmup — preload de modelos, cache e registry."""

from app.runtime.runtime_warmup.runtime_warmup_engine_v1 import (
    get_warmup_status,
    run_startup_warmup,
    warmup_payload,
)

__all__ = ["get_warmup_status", "run_startup_warmup", "warmup_payload"]
