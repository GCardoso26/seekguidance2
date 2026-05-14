"""Guards de proteção de runtime."""

from __future__ import annotations


def guard_runtime_limits(*, recursion_depth: int, max_depth: int, queue_size: int, max_queue: int) -> list[str]:
    flags: list[str] = []
    if recursion_depth > max_depth:
        flags.append("recursion_depth_exceeded")
    if queue_size > max_queue:
        flags.append("event_queue_exceeded")
    return flags
