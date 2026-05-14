from app.mobile_runtime.storage import mobile_local_storage_stub


def test_mobile_storage() -> None:
    assert mobile_local_storage_stub(2)["queue_depth"] == 2
