import os

# Must run before any test imports app.main: middlewares read settings when the app is built.
os.environ["ALLOWED_HOSTS"] = "testserver,localhost,127.0.0.1"
# A developer's server/.env must not change test results.
os.environ["APP_ORIGINS"] = "http://localhost:5175"
os.environ["ACCESS_REQUIRED"] = "true"

import pytest

from app.settings import get_settings

get_settings.cache_clear()

from app.access import require_access
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


# Existing suites don't send credentials; access tests remove this override.
@pytest.fixture(autouse=True)
def access_off():
    app.dependency_overrides[require_access] = no_limit
    yield
    app.dependency_overrides.pop(require_access, None)
