from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_analytics_endpoints_exist() -> None:
    # basic smoke tests to ensure new analytics routes are wired up and
    # return the expected shape even when the database is empty.
    resp = client.get("/analytics")
    assert resp.status_code == 200
    body = resp.json()
    assert "total_revenue" in body

    resp = client.get("/analytics/trends")
    assert resp.status_code == 200
    body = resp.json()
    assert "period" in body and "points" in body
    # ensure new schema includes cost field (might be zero when empty DB)
    if body.get("points"):
        assert "total_amount" in body["points"][0]
        assert "total_cost" in body["points"][0]

    resp = client.get("/analytics/stock")
    assert resp.status_code == 200
    body = resp.json()
    assert "total_stock" in body and "categories" in body

    resp = client.get("/analytics/top-customers")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

    resp = client.get("/analytics/channels")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
