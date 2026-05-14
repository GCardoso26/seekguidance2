"""Matriz de regressão cross-TCG (soft)."""

from __future__ import annotations

from typing import Any


def cross_tcg_regression_matrix_stub(cells: dict[tuple[str, str], float]) -> dict[str, Any]:
    return {
        "cells": {f"{a}|{b}": v for (a, b), v in cells.items()},
        "assistant_notes": ["Matriz compara tendências, não transporta legalidade."],
    }
