import asyncio
import base64

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app import guards, hermes
from app.access import require_access
from app.main import app
from app.settings import Settings, get_settings

PROFILE = {"profile": {}}


def use_code(code: str | None):
    app.dependency_overrides[get_settings] = lambda: Settings(
        access_code=None if code is None else SecretStr(code)
    )


@pytest.fixture(autouse=True)
def gate_on():
    app.dependency_overrides.pop(require_access, None)
    guards.hermes_limiter.hits.clear()
    yield
    app.dependency_overrides.pop(get_settings, None)
    guards.hermes_limiter.hits.clear()


def post(client: TestClient, **kwargs):
    return client.post("/api/solution", json=PROFILE, **kwargs)


# No WWW-Authenticate challenge: the app asks for the code itself, so the browser never pops its own prompt.
def test_gated_route_without_credentials_is_401_without_browser_prompt():
    use_code("abc")
    with TestClient(app) as client:
        response = post(client)
    assert response.status_code == 401
    assert response.json() == {"detail": "access_required"}
    assert "WWW-Authenticate" not in response.headers


@pytest.mark.parametrize("code", [None, ""])
def test_unconfigured_code_is_503(code):
    use_code(code)
    with TestClient(app) as client:
        response = post(client, auth=("x", ""))
    assert response.status_code == 503
    assert response.json() == {"detail": "access_not_configured"}


def test_wrong_password_is_401():
    use_code("abc")
    with TestClient(app) as client:
        response = post(client, auth=("x", "nope"))
    assert response.status_code == 401
    assert "WWW-Authenticate" not in response.headers


def reach_route(monkeypatch):
    async def boom(*args, **kwargs):
        raise hermes.HermesError("down")

    async def boom_stream(*args, **kwargs):
        raise hermes.HermesError("down")
        yield  # makes this an async generator like stream_hermes_json

    monkeypatch.setattr(hermes, "ask_hermes", boom)
    monkeypatch.setattr(hermes, "stream_hermes_json", boom_stream)


def test_password_with_whitespace_is_accepted(monkeypatch):
    use_code("abc")
    reach_route(monkeypatch)
    with TestClient(app) as client:
        assert post(client, auth=("x", "  abc ")).status_code == 502


def test_username_is_ignored(monkeypatch):
    use_code("abc")
    reach_route(monkeypatch)
    with TestClient(app) as client:
        assert post(client, auth=("anyone", "abc")).status_code == 502


def test_ungated_routes_stay_open():
    use_code("abc")
    with TestClient(app) as client:
        assert client.get("/api/health").status_code == 200
        assert client.get("/api/survey").status_code == 200


def test_wrong_passwords_count_against_the_limit():
    use_code("abc")
    app.dependency_overrides.pop(guards.limit_hermes_runs, None)
    limit = guards.HERMES_RUNS_PER_MINUTE
    with TestClient(app) as client:
        codes = [post(client, auth=("x", "bad")).status_code for _ in range(limit + 1)]
    assert codes == [401] * limit + [429]


@pytest.mark.parametrize(
    "header",
    [
        "Basic !!!",
        "Basic " + base64.b64encode(b"nocolon").decode(),
        "Basic " + base64.b64encode(b"x:\xff\xfe").decode(),
        "Bearer x",
        "Basic",
    ],
)
def test_malformed_authorization_is_401(header):
    use_code("abc")
    with TestClient(app) as client:
        response = post(client, headers={"Authorization": header})
    assert response.status_code == 401
    assert response.json() == {"detail": "access_required"}
    assert "WWW-Authenticate" not in response.headers


def basic(user: str, password: str) -> dict[str, str]:
    token = base64.b64encode(f"{user}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


def test_non_ascii_password_is_accepted(monkeypatch):
    use_code("äöü")
    reach_route(monkeypatch)
    with TestClient(app) as client:
        assert post(client, headers=basic("x", "äöü")).status_code == 502


def test_scheme_is_case_insensitive(monkeypatch):
    use_code("abc")
    reach_route(monkeypatch)
    headers = {"Authorization": basic("x", "abc")["Authorization"].replace("Basic", "bAsIc")}
    with TestClient(app) as client:
        assert post(client, headers=headers).status_code == 502


def test_empty_password_is_401():
    use_code("abc")
    with TestClient(app) as client:
        assert post(client, auth=("x", "")).status_code == 401


def test_configured_code_is_stripped(monkeypatch):
    use_code("  abc\n")
    reach_route(monkeypatch)
    with TestClient(app) as client:
        assert post(client, auth=("x", "abc")).status_code == 502


def test_whitespace_only_code_is_503():
    use_code("  \n")
    with TestClient(app) as client:
        assert post(client, auth=("x", "")).status_code == 503


# Behind another login (Vercel deployment protection) the code can be switched off; the default stays on.
def test_access_check_can_be_switched_off_by_setting():
    # Returns before it looks at the request, so no request and no Hermes call are needed.
    assert asyncio.run(require_access(None, Settings(access_code=SecretStr("abc"), access_required=False))) is None


def test_access_check_is_on_by_default():
    assert Settings().access_required is True
