from fastapi import Depends, FastAPI
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.guards import BodySizeLimitMiddleware, OriginCheckMiddleware, limit_hermes_runs
from app.routers import assess, generate, health, profile, solution, survey
from app.settings import get_settings

app = FastAPI(title="Learning in Progress API")

# Last added is outermost: Host is checked first, then body size, then Origin.
app.add_middleware(OriginCheckMiddleware)
app.add_middleware(BodySizeLimitMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=get_settings().allowed_hosts)

# Routes that call Hermes share one per-client rate limit.
hermes_limit = [Depends(limit_hermes_runs)]

# Every route lives under /api, matching the client's dev proxy.
app.include_router(health.router, prefix="/api")
app.include_router(assess.router, prefix="/api", dependencies=hermes_limit)
app.include_router(generate.router, prefix="/api", dependencies=hermes_limit)
app.include_router(survey.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(solution.router, prefix="/api", dependencies=hermes_limit)
