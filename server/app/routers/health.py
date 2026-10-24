from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str


# Lets the client, load balancers, and uptime checks confirm the server is running.
@router.get("/health")
async def health() -> HealthResponse:
    return HealthResponse(status="ok")
