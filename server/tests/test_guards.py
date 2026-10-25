import pytest
from fastapi.testclient import TestClient

from app import guards
from app.main import app
from tests.test_generate import PATCHES, REQUEST, fake_stream, jsonl

client = TestClient(app)


@pytest.fixture
def real_limiter():
    app.dependency_overrides.pop(guards.limit_hermes_runs, None)
    guards.hermes_limiter.hits.clear()
    yield
    guards.hermes_limiter.hits.clear()


def test_post_from_null_origin_is_403():
    response = client.post("/api/survey", json={}, headers={"Origin": "null"})
    assert response.status_code == 403
    assert response.json() == {"detail": "origin_not_allowed"}


def test_post_from_foreign_origin_is_403():
    response = client.post("/api/survey", json={}, headers={"Origin": "https://evil.example"})
    assert response.status_code == 403
    assert response.json() == {"detail": "origin_not_allowed"}


def test_post_without_origin_passes():
    assert client.post("/api/survey", json={}).status_code != 403


def test_post_from_allowed_origin_passes():
    response = client.post("/api/survey", json={}, headers={"Origin": "http://localhost:5175"})
    assert response.status_code != 403


def test_get_from_foreign_origin_passes():
    response = client.get("/api/health", headers={"Origin": "https://evil.example"})
    assert response.status_code == 200


def test_host_with_port_is_allowed():
    assert client.get("/api/health", headers={"Host": "localhost:5175"}).status_code == 200


def test_foreign_host_is_400():
    assert client.get("/api/health", headers={"Host": "evil.example"}).status_code == 400


def test_post_without_length_is_411():
    response = client.post("/api/survey", content=iter([b"{}"]))
    assert response.status_code == 411
    assert response.json() == {"detail": "length_required"}


def test_body_over_limit_is_413():
    response = client.post("/api/survey", content=b"x" * 262_145)
    assert response.status_code == 413
    assert response.json() == {"detail": "request_too_large"}


def test_full_german_material_passes_limit(monkeypatch):
    fake_stream(monkeypatch, [("text", jsonl(*PATCHES))])
    body = {**REQUEST, "material": "ä" * 60_000}
    response = client.post("/api/generate", json=body)
    assert response.status_code == 200


def test_call_after_the_minute_quota_is_429(monkeypatch, real_limiter):
    fake_stream(monkeypatch, [("text", jsonl(*PATCHES))])
    for _ in range(guards.HERMES_RUNS_PER_MINUTE):
        assert client.post("/api/generate", json=REQUEST).status_code == 200
    response = client.post("/api/generate", json=REQUEST)
    assert response.status_code == 429
    assert response.json() == {"detail": "too_many_requests"}
    assert int(response.headers["Retry-After"]) >= 1


def test_limiter_resets_after_a_minute(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(guards.time, "monotonic", lambda: now[0])
    limiter = guards.RateLimiter(per_minute=2)
    assert limiter.hit("a") is None
    assert limiter.hit("a") is None
    assert limiter.hit("a") == 60
    assert limiter.hit("b") is None
    now[0] += 61
    assert limiter.hit("a") is None


