import re
from pathlib import Path
from typing import Literal

# Theme specs by name (the file name without .txt), loaded once at startup.
THEMES = {
    path.stem: path.read_text(encoding="utf-8")
    for path in sorted((Path(__file__).parent / "prompts" / "themes").glob("*.txt"))
}

# Used when the assessment ends without a usable pick, and when a generation names no theme.
DEFAULT_THEME = "chunked"

# Type for request and reply fields that name a theme, so an unknown name fails validation.
ThemeName = Literal[tuple(THEMES)]


# Summarises a theme for choosing between them: its title, the first sentence of its intro, and its "Who it fits" section.
def summary(name: str) -> str:
    spec = THEMES[name]
    title = spec.splitlines()[0].split("—", 1)[1].strip()
    intro = spec.split("\n\n")[1]
    first_sentence = re.match(r".+?[.!?](?=\s|$)", intro).group()
    fits = re.search(r"### Who it fits\n\n(.+?)(?=\n\n|\Z)", spec, re.S).group(1).strip()
    return f"- {name} ({title}): {first_sentence} Fits: {fits}"
