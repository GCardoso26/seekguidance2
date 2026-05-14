"""Evolução de políticas publicadas (rastreio de versão)."""

from __future__ import annotations


def policy_version_stub(name: str, version: str) -> dict[str, str]:
    return {"policy": name, "version": version}
