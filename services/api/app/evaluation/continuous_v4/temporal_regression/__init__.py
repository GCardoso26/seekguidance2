"""Regressão temporal."""

from __future__ import annotations


def temporal_regression_flag(before: str, after: str) -> bool:
    return before > after
