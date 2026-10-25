import base64
import binascii
import secrets
from typing import Annotated

from fastapi import Depends, HTTPException, Request

from app.settings import Settings, get_settings


# Parsed by hand: FastAPI's HTTPBasic decodes ASCII only and raises its own 401 on malformed headers.
def basic_password(header: str | None) -> str | None:
    scheme, _, token = (header or "").partition(" ")
    if scheme.lower() != "basic":
        return None
    try:
        decoded = base64.b64decode(token.strip(), validate=True).decode("utf-8")
    except (binascii.Error, UnicodeDecodeError):
        return None
    _, colon, password = decoded.partition(":")
    return password if colon else None


# Shared access code as HTTP Basic password; the username is ignored.
# No WWW-Authenticate challenge on 401: the client asks for the code once and keeps it, so the browser never prompts.
async def require_access(request: Request, settings: Annotated[Settings, Depends(get_settings)]) -> None:
    if not settings.access_required:
        return
    code = settings.access_code.get_secret_value().strip() if settings.access_code else ""
    # An empty code counts as unset: it must never open the gate.
    if not code:
        raise HTTPException(503, "access_not_configured")
    password = basic_password(request.headers.get("authorization"))
    if password is None or not secrets.compare_digest(password.strip().encode(), code.encode()):
        raise HTTPException(401, "access_required")
