import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient


# ── Patch MongoDB before importing app ────────────────────────────────────────
@pytest.fixture(autouse=True)
def mock_mongo(monkeypatch):
    """Patch MongoDB connect/disconnect so tests run without a real DB."""
    monkeypatch.setenv("JWT_SECRET", "test-secret-key-for-unit-testing")
    monkeypatch.setattr("app.db.mongodb.connect_to_mongo", AsyncMock())
    monkeypatch.setattr("app.db.mongodb.close_mongo_connection", AsyncMock())
    monkeypatch.setattr("app.db.init_db.init_indexes", AsyncMock())


@pytest.fixture
def client():
    from app.main import app
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


# ── Health Check ──────────────────────────────────────────────────────────────
def test_health_check(client):
    """GET /health should return 200 with status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "planify-backend"


# ── Auth Middleware ───────────────────────────────────────────────────────────
def test_protected_route_no_token(client):
    """Request to a protected route without a token should return 401."""
    response = client.get("/api/projects")
    assert response.status_code == 401
    assert "detail" in response.json()


def test_protected_route_invalid_token(client):
    """Request with an invalid bearer token should return 401."""
    response = client.get(
        "/api/projects",
        headers={"Authorization": "Bearer this.is.not.valid"},
    )
    assert response.status_code == 401
