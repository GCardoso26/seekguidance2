"""Stress de cadeia Yu-Gi-Oh (SEGOC/implicit — sinais)."""

from __future__ import annotations


def yugioh_chain_pressure(*, chain_length: int, segoc_tokens: int) -> dict[str, object]:
    return {"high_pressure": chain_length > 6 or segoc_tokens > 4, "chain_length": chain_length}
