from pathlib import Path


def test_storage_readme_present() -> None:
    root = Path(__file__).resolve().parents[4]
    assert (root / "infra" / "aws" / "storage" / "README.md").is_file()
