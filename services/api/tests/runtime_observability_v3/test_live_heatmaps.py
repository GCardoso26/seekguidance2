from app.observability.live_runtime import live_replay_heatmaps_stub


def test_live_replay_heatmaps() -> None:
    out = live_replay_heatmaps_stub("sess-1")
    assert out["layer"] == "live_replay_heatmaps"
