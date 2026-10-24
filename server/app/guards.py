import time

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.settings import get_settings

MAX_BODY_BYTES = 262_144
HERMES_RUNS_PER_MINUTE = 6

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
BODY_METHODS = {"POST", "PUT", "PATCH"}


def error(status: int, code: str, headers: dict[str, str] | None = None) -> JSONResponse:
    return JSONResponse({"detail": code}, status_code=status, headers=headers)


class OriginCheckMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app
        self.origins = set(get_settings().app_origins)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and scope["method"] not in SAFE_METHODS:
            headers = dict(scope["headers"])
            origin = headers.get(b"origin")
            if origin is not None and origin.decode("latin-1") not in self.origins:
                await error(403, "origin_not_allowed")(scope, receive, send)
                return
        await self.app(scope, receive, send)


class BodySizeLimitMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http" and scope["method"] in BODY_METHODS:
            length = dict(scope["headers"]).get(b"content-length")
            if length is None:
                await error(411, "length_required")(scope, receive, send)
                return
            if not length.isdigit() or int(length) > MAX_BODY_BYTES:
                await error(413, "request_too_large")(scope, receive, send)
                return
        await self.app(scope, receive, send)


class RateLimiter:
    def __init__(self, per_minute: int) -> None:
        self.per_minute = per_minute
        self.hits: dict[str, tuple[float, int]] = {}

    # Returns seconds until the window resets, or None when the call is allowed.
    def hit(self, key: str) -> int | None:
        now = time.monotonic()
        start, count = self.hits.get(key, (now, 0))
        if now - start >= 60:
            start, count = now, 0
        if count >= self.per_minute:
            return max(1, int(start + 60 - now + 0.999))
        self.hits[key] = (start, count + 1)
        return None


# ponytail: in-process memory; move to Redis or the reverse proxy when running several workers.
hermes_limiter = RateLimiter(HERMES_RUNS_PER_MINUTE)


async def limit_hermes_runs(request: Request) -> None:
    retry_after = hermes_limiter.hit(request.client.host if request.client else "unknown")
    if retry_after is not None:
        raise HTTPException(429, "too_many_requests", headers={"Retry-After": str(retry_after)})
