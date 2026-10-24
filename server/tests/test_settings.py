from app.settings import Settings

ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://localhost:4173",
]


def test_defaults(monkeypatch):
    for name in ("APP_ORIGINS", "ALLOWED_HOSTS", "ACCESS_CODE"):
        monkeypatch.delenv(name, raising=False)
    s = Settings(_env_file=None)
    assert s.app_origins == ORIGINS
    assert s.allowed_hosts == ["localhost", "127.0.0.1"]
    assert s.access_code is None


def test_comma_lists_are_split_and_stripped(monkeypatch):
    monkeypatch.setenv("APP_ORIGINS", " http://a , http://b ")
    assert Settings(_env_file=None).app_origins == ["http://a", "http://b"]


def test_access_code_is_secret():
    assert "hunter2" not in repr(Settings(_env_file=None, access_code="hunter2"))
