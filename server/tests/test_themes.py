from app import themes


def test_every_theme_has_a_summary_with_title_intro_and_fits():
    for name in themes.THEMES:
        summary = themes.summary(name)

        assert summary.startswith(f"- {name} (")
        assert "Build" in summary
        assert "Fits: " in summary


def test_default_theme_exists():
    assert themes.DEFAULT_THEME in themes.THEMES
