import os

# Must run before any test imports app.main: middlewares read settings when the app is built.
os.environ["ALLOWED_HOSTS"] = "testserver,localhost,127.0.0.1"

import pytest

from app.settings import get_settings

get_settings.cache_clear()

from app.guards import limit_hermes_runs
from app.main import app


async def no_limit() -> None:
    return None


# Existing suites call Hermes routes freely; guard tests remove this override.
@pytest.fixture(autouse=True)
def hermes_limit_off():
    app.dependency_overrides[limit_hermes_runs] = no_limit
    yield
    app.dependency_overrides.pop(limit_hermes_runs, None)
