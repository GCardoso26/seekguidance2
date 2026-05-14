from pathlib import Path


def test_autoscaling_profiles_doc() -> None:
    root = Path(__file__).resolve().parents[4]
    assert (root / "infra" / "aws" / "runtime" / "autoscaling_profiles" / "README.md").is_file()
