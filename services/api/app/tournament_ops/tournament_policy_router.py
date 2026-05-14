"""Encaminhamento de política de torneio."""

from __future__ import annotations


def route_policy(topic: str) -> str:
    return f"policy_topic:{topic}"
