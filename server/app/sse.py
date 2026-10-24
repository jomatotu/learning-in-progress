import json
from typing import Any


# Formats one server-sent event for the client's streamRequest.
def sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
