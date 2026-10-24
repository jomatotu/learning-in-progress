from app.sse import TextBatch


def test_text_batch_releases_text_once_it_reaches_the_size():
    batch = TextBatch(size=5, seconds=60)

    assert batch.add("ab") is None
    assert batch.add("cde") == "abcde"
    assert batch.add("f") is None
    assert batch.flush() == "f"


def test_text_batch_releases_text_once_it_is_old_enough():
    batch = TextBatch(size=1000, seconds=0)

    assert batch.add("ab") == "ab"
