#!/usr/bin/env python3
"""CLI de avaliação Judge para CI local."""

from __future__ import annotations

import sys
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1] / "services" / "api"
sys.path.insert(0, str(API_ROOT))

from evaluation.judge_quality.runner import run_ci_gate  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(run_ci_gate())
