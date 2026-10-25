from pathlib import Path

from app.routers.solution import GENERATED_DIR, SolutionRequest, fill_prompt


def test_prompt_contains_absolute_target_path() -> None:
    target = GENERATED_DIR / "abc.tsx"
    prompt = fill_prompt(SolutionRequest(profile={"a": 1}), target)
    assert Path(str(target)).is_absolute()
    assert str(target) in prompt
