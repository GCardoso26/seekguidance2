from pathlib import Path


def test_disaster_recovery_readme() -> None:
    root = Path(__file__).resolve().parents[4]
    assert (root / "infra" / "aws" / "disaster_recovery" / "README.md").is_file()
