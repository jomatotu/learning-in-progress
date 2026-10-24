import secrets
from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.settings import Settings, get_settings

CHALLENGE = {"WWW-Authenticate": 'Basic realm="Learning in Progress", charset="UTF-8"'}

basic = HTTPBasic(auto_error=False)


# Shared access code as HTTP Basic password; the username is ignored.
async def require_access(
    credentials: Annotated[HTTPBasicCredentials | None, Depends(basic)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    code = settings.access_code.get_secret_value() if settings.access_code else ""
    # An empty code counts as unset: it must never open the gate.
    if not code:
        raise HTTPException(503, "access_not_configured")
    if credentials is None or not secrets.compare_digest(credentials.password.strip().encode(), code.encode()):
        raise HTTPException(401, "access_required", headers=CHALLENGE)
