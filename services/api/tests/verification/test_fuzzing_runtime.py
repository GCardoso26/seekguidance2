from app.testing.fuzzing.runtime_fuzzer import run_runtime_fuzzer


def test_fuzzing_runtime_runs() -> None:
    out = run_runtime_fuzzer(cases=32)
    assert out["cases_executed"] == 32
