from pathlib import Path

from app.core.config import get_settings


def test_aws_platform_disabled_by_default() -> None:
    get_settings.cache_clear()
    s = get_settings()
    assert s.aws_platform_enabled is False
    assert s.s3_replay_archive_bucket is None


def test_aws_runtime_doc_exists() -> None:
    root = Path(__file__).resolve().parents[4]
    assert (root / "docs" / "AWS_RUNTIME_PLATFORM.md").is_file()
