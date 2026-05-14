"""Precisão em loops de replacement."""

from __future__ import annotations


def replacement_loop_accuracy(detected: bool, actual: bool) -> float:
    return 1.0 if detected == actual else 0.0
