from fastapi import Depends, FastAPI
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.access import require_access
from app.guards import BodySizeLimitMiddleware, OriginCheckMiddleware, limit_hermes_runs
from app.routers import (
    assess,
    feedback,
    generate,
    health,
    intake,
    profile,
    solution,
    survey,
)
from app.settings import get_settings

app = FastAPI(title="Learning in Progress API")

# Last added is outermost: Host is checked first, then body size, then Origin.
app.add_middleware(OriginCheckMiddleware)
app.add_middleware(BodySizeLimitMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=get_settings().allowed_hosts)

# Routes that call Hermes: rate limit first (wrong passwords count), then the access code.
hermes_gate = [Depends(limit_hermes_runs), Depends(require_access)]

# Every route lives under /api, matching the client's dev proxy.
app.include_router(health.router, prefix="/api")
app.include_router(assess.router, prefix="/api", dependencies=hermes_gate)
app.include_router(generate.router, prefix="/api", dependencies=hermes_gate)
app.include_router(intake.router, prefix="/api", dependencies=hermes_gate)
# No Hermes call, but gated the same way: it writes into a student's notes.
app.include_router(feedback.router, prefix="/api", dependencies=hermes_gate)
app.include_router(survey.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(solution.router, prefix="/api", dependencies=hermes_gate)
