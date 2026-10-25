from app.scale import evaluate, load_scale, score_category


def category(category_id):
    return next(c for c in load_scale()["categories"] if c["id"] == category_id)


def test_reverses_marked_items_so_higher_always_means_easier():
    # at2 is the only positive item; the rest are reversed.
    result = score_category(category("attention"), {"at1": 1, "at2": 5, "at3": 1, "at4": 1})

    assert result.score == 100
    assert result.band == "high"


def test_middle_answers_land_in_the_medium_band():
    result = score_category(category("attention"), {"at1": 3, "at2": 3, "at3": 3, "at4": 3})

    assert result.score == 50
    assert result.band == "medium"
    assert result.ai_instructions == category("attention")["bands"]["medium"]["ai_instructions"]


def test_scores_from_answered_items_only():
    result = score_category(category("attention"), {"at1": 5, "at3": 5})

    assert result.score == 0
    assert result.band == "low"


def test_rounds_half_up():
    # wm1, wm2, wm4 are reversed: 3, 3, 2, plus wm3 = 2. Mean 2.5 is a score of 37.5, rounded up to 38.
    result = score_category(category("working_memory"), {"wm1": 3, "wm2": 3, "wm3": 2, "wm4": 4})

    assert result.score == 38


def test_skipped_category_is_unknown_without_instructions():
    result = score_category(category("attention"), {})

    assert result.band == "unknown"
    assert result.score is None
    assert result.ai_instructions == []


def test_scale_has_30_items_in_8_categories_with_every_band_filled():
    categories = load_scale()["categories"]
    items = [item for c in categories for item in c["items"]]

    assert len(categories) == 8
    assert len(items) == 30
    assert len({item["id"] for item in items}) == 30
    for c in categories:
        for band in ("low", "medium", "high"):
            assert c["bands"][band]["ai_instructions"]
    assert [r.id for r in evaluate({})] == [c["id"] for c in categories]
