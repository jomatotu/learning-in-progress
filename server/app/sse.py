import json
import time
from typing import Any


# Formats one server-sent event for the client's streamRequest.
def sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


# Collects small streamed pieces (e.g. reasoning tokens) and releases them in larger chunks,
# so the client gets a few events per second instead of one per token.
class TextBatch:
    def __init__(self, size: int = 200, seconds: float = 0.5):
        self.size = size
        self.seconds = seconds
        self.text = ""
        self.released_at = time.monotonic()

    # Adds a piece and returns the collected text once it is big or old enough, otherwise None.
    def add(self, piece: str) -> str | None:
        self.text += piece
        if len(self.text) < self.size and time.monotonic() - self.released_at < self.seconds:
            return None
        return self.flush()

    # Returns whatever is collected, e.g. when the stream ends.
    def flush(self) -> str:
        text, self.text = self.text, ""
        self.released_at = time.monotonic()
        return text
