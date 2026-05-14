"""Tracking de políticas da publisher."""

from __future__ import annotations


def publisher_policy_version_stub(pub: str, ver: str) -> dict[str, str]:
    return {"publisher": pub, "version": ver}
