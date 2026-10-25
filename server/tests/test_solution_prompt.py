from pathlib import Path

from app.routers.solution import GENERATED_DIR, SolutionRequest, fill_prompt


def test_prompt_contains_absolute_target_path() -> None:
    target = GENERATED_DIR / "abc.tsx"
    prompt = fill_prompt(SolutionRequest(profile={"a": 1}), target)
    assert Path(str(target)).is_absolute()
    assert str(target) in prompt


def test_read_only_target_gives_german_error_not_crash(tmp_path, monkeypatch) -> None:
    from fastapi.testclient import TestClient

    from app.main import app
    from app.routers import solution

    blocker = tmp_path / "file"
    blocker.write_text("")
    monkeypatch.setattr(solution, "GENERATED_DIR", blocker / "generated")
    response = TestClient(app).post("/api/solution", json={"profile": {}})
    assert response.status_code == 500
    assert response.json()["detail"] == "Die Seite konnte nicht angelegt werden. Versuch es nochmal."
