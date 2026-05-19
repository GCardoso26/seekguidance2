from pathlib import Path
REPO = Path(__file__).resolve().parents[3]
FE = REPO / "frontend" / "runtime_console_v3"

def test_frontend_package_exists():
    assert (FE / "package.json").is_file()
    assert (FE / "src/app/login/page.tsx").is_file()
    assert (FE / "src/app/dashboard/page.tsx").is_file()
