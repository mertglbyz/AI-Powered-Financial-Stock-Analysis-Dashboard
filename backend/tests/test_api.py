"""FastAPI endpoint testleri – ağ erişimi olmadan (yfinance ve model mock'lanır)."""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main  # noqa: E402
import ml_model  # noqa: E402
from data_pipeline import DataFetchError, add_indicators, clean_data  # noqa: E402


def _fake_processed(ticker: str, period: str = "5y") -> pd.DataFrame:
    if "INVALID" in ticker:
        raise DataFetchError(f"'{ticker}' için veri bulunamadı.")
    rng = np.random.default_rng(1)
    n = 500
    idx = pd.bdate_range("2023-01-02", periods=n, name="Date")
    close = 100 * np.exp(np.cumsum(rng.normal(0, 0.01, n)))
    df = pd.DataFrame(
        {"Open": close, "High": close * 1.01, "Low": close * 0.99, "Close": close,
         "Volume": rng.integers(1_000, 5_000, n).astype(float)},
        index=idx,
    )
    return add_indicators(clean_data(df))


@pytest.fixture
def client(monkeypatch, tmp_path):
    monkeypatch.setattr(main, "get_processed_data", _fake_processed)
    monkeypatch.setattr(ml_model, "get_processed_data", _fake_processed)
    monkeypatch.setattr(ml_model, "_safe_market", lambda: None)
    monkeypatch.setattr(ml_model, "_model_cache", None)
    monkeypatch.setattr(ml_model, "MODEL_PATH", tmp_path / "model.pkl")
    monkeypatch.setattr(main, "AUTO_TRAIN", False)
    return TestClient(main.app)


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_tickers_search(client):
    r = client.get("/api/tickers", params={"q": "thy"})
    assert r.status_code == 200
    assert r.json()[0]["symbol"] == "THYAO.IS"
    # Türkçe karakter duyarsız arama
    r = client.get("/api/tickers", params={"q": "sisecam"})
    assert any(t["code"] == "SISE" for t in r.json())


def test_historical_ok(client):
    r = client.get("/api/historical/thyao", params={"period": "6mo"})
    assert r.status_code == 200
    body = r.json()
    assert body["ticker"] == "THYAO.IS"
    assert body["name"] == "Türk Hava Yolları"
    assert body["count"] == len(body["data"]) > 0
    assert {"sma_20", "sma_50", "rsi_14", "macd"} <= body["data"][0].keys()


def test_historical_404(client):
    r = client.get("/api/historical/INVALIDXYZ")
    assert r.status_code == 404
    assert r.json()["error"] == "data_not_found"


def test_historical_bad_period(client):
    assert client.get("/api/historical/THYAO", params={"period": "10y"}).status_code == 422


def test_predict_503_when_no_model(client):
    r = client.get("/api/predict/THYAO")
    assert r.status_code == 503
    assert r.json()["error"] == "model_not_ready"


def test_predict_ok_after_training(client, monkeypatch):
    monkeypatch.setattr(ml_model, "create_regressor",
                        lambda: ml_model.RandomForestRegressor(n_estimators=10, max_depth=4, random_state=0))
    monkeypatch.setattr(ml_model, "create_classifier",
                        lambda: ml_model.RandomForestClassifier(n_estimators=10, max_depth=4, random_state=0))
    ml_model.train_model(tickers=["AAA.IS", "BBB.IS"], save_path=ml_model.MODEL_PATH)

    r = client.get("/api/predict/THYAO")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["trend"] in {"BULLISH", "BEARISH", "NEUTRAL"}
    assert 0 <= body["probability_up"] <= 1
    assert body["price_range_low"] <= body["price_range_high"]
    assert len(body["signals"]) == 5

    info = client.get("/api/model/info")
    assert info.status_code == 200
    assert "directional_accuracy" in info.json()["metrics"]


def test_market_overview(client):
    r = client.get("/api/market/overview")
    assert r.status_code == 200
    body = r.json()
    assert "bist100" in body
    assert "sentiment_barometer" in body
    assert len(body["popular_stocks"]) > 0
    assert "market_sentiment" in body["sentiment_barometer"]
