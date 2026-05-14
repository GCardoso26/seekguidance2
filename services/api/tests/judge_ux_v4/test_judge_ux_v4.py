from pathlib import Path


def test_judge_ux_v4_html_modules_exist() -> None:
    repo = Path(__file__).resolve().parents[4]
    files = [
        repo / "apps" / "judge_replay" / "legality_runtime_viewer.html",
        repo / "apps" / "judge_console" / "solver_runtime_console.html",
        repo / "apps" / "stack_visualizer" / "segoc_runtime_visualizer.html",
    ]
    for f in files:
        assert f.is_file(), f"missing {f}"
