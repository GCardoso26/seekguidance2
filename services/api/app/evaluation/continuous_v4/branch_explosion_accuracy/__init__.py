"""Precisão em explosão de ramos."""

from __future__ import annotations


def branch_explosion_accuracy(predicted_over: bool, actual_over: bool) -> float:
    return 1.0 if predicted_over == actual_over else 0.5
