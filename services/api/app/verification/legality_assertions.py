"""Asserções de legalidade (hooks para verificação futura)."""

from __future__ import annotations

from typing import Any


def assert_chain_legal(flags: dict[str, bool]) -> dict[str, Any]:
    return {"legal": all(flags.values()), "failed": [k for k, v in flags.items() if not v]}
