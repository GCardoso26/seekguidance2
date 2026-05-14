import os
import sys
from pathlib import Path

_root = Path(__file__).resolve().parents[2]
_ingestion = _root / "ingestion"
if _ingestion.is_dir():
    sys.path.insert(0, str(_ingestion))

_workers = _root / "workers"
if _workers.is_dir():
    sys.path.insert(0, str(_workers))

_evaluation = _root / "api" / "evaluation"
if _evaluation.is_dir():
    sys.path.insert(0, str(_evaluation))

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://tcgjudge:tcgjudge_dev@127.0.0.1:5432/tcg_judge",
)
os.environ.setdefault("REDIS_URL", "redis://127.0.0.1:6379/15")
