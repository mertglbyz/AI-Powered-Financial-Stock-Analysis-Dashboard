"""
FastAPI Backend
---------------
Endpoint'ler:
  GET  /api/health                 – servis + model durumu
  GET  /api/tickers?q=garan        – BIST hisse arama (otomatik tamamlama)
  GET  /api/historical/{ticker}    – OHLCV + indikatörler + özet istatistikler
  GET  /api/predict/{ticker}       – ML tahmini (fiyat, yön olasılığı, teknik sinyaller)
  GET  /api/model/info             – model metrikleri ve özellik önemleri
  POST /api/model/train            – manuel yeniden eğitim (arka planda)

Çalıştırma:  uvicorn main:app --reload --port 8000
Dokümantasyon: http://localhost:8000/docs
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Literal

import pandas as pd
from fastapi import FastAPI, Header, HTTPException, Path, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

import ml_model
from bist_tickers import BIST_TICKERS, company_name, search_tickers
from data_pipeline import DataFetchError, get_processed_data, normalize_ticker

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("api")

CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if o.strip()]
AUTO_TRAIN = os.getenv("AUTO_TRAIN", "1") == "1"
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")  # ayarlanırsa /api/model/train için gerekli

Period = Literal["1mo", "3mo", "6mo", "1y", "2y", "5y"]
PERIOD_DAYS: dict[str, int] = {"1mo": 31, "3mo": 92, "6mo": 183, "1y": 365, "2y": 730, "5y": 1830}
TrendType = Literal["BULLISH", "BEARISH", "NEUTRAL"]


# ---------------------------------------------------------------------------
# Pydantic şemaları
# ---------------------------------------------------------------------------
class ErrorResponse(BaseModel):
    error: str
    detail: str


class TickerItem(BaseModel):
    symbol: str = Field(examples=["THYAO.IS"])
    code: str = Field(examples=["THYAO"])
    name: str = Field(examples=["Türk Hava Yolları"])


class StockDataPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    sma_20: float
    sma_50: float
    rsi_14: float
    macd: float
    macd_signal: float
    macd_hist: float
    bb_upper: float
    bb_lower: float
    atr_14: float


class HistoricalSummary(BaseModel):
    last_close: float
    prev_close: float
    change: float
    change_pct: float
    period_return_pct: float
    high_52w: float
    low_52w: float
    volume: float
    avg_volume_20: float


class HistoricalResponse(BaseModel):
    ticker: str
    name: str | None
    period: str
    count: int
    summary: HistoricalSummary
    data: list[StockDataPoint]


class Signal(BaseModel):
    name: str
    value: float
    signal: TrendType
    description: str


class PredictionResponse(BaseModel):
    ticker: str
    name: str | None = None
    last_close: float
    last_date: str
    predicted_price: float
    predicted_change_pct: float
    price_range_low: float
    price_range_high: float
    probability_up: float
    trend: TrendType
    confidence: float
    signals: list[Signal]
    model_trained_at: str | None


class TrainingStatus(BaseModel):
    status: str
    started_at: str | None
    finished_at: str | None
    error: str | None


class HealthResponse(BaseModel):
    status: str
    model_ready: bool
    training: TrainingStatus
    ticker_count: int


class ModelInfoResponse(BaseModel):
    version: int
    trained_at: str
    tickers: list[str]
    train_size: int
    test_size: int
    test_period: dict[str, str]
    metrics: dict[str, float]
    feature_importances: list[dict[str, float | str]]


# ---------------------------------------------------------------------------
# Uygulama
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(_: FastAPI):
    if AUTO_TRAIN and not ml_model.model_available():
        logger.info("Model bulunamadı – arka planda eğitim başlatılıyor.")
        ml_model.start_background_training()
    yield


app = FastAPI(
    title="AI-Powered BIST Stock Analysis API",
    description="Borsa İstanbul hisseleri için teknik analiz ve makine öğrenmesi tahminleri.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, dict) else {"error": "error", "detail": str(exc.detail)}
    return JSONResponse(status_code=exc.status_code, content=detail)


def _error(status: int, error: str, detail: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"error": error, "detail": detail})


def _resolve_ticker(ticker: str) -> str:
    try:
        return normalize_ticker(ticker)
    except ValueError as exc:
        raise _error(400, "invalid_ticker", str(exc)) from exc


# ---------------------------------------------------------------------------
# Endpoint'ler
# ---------------------------------------------------------------------------
@app.get("/api/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_ready=ml_model.model_available(),
        training=TrainingStatus(**ml_model.training_state),
        ticker_count=len(BIST_TICKERS),
    )


@app.get("/api/tickers", response_model=list[TickerItem], tags=["market"])
def tickers(q: str = Query("", max_length=40), limit: int = Query(20, ge=1, le=500)) -> list[TickerItem]:
    return [TickerItem(**t) for t in search_tickers(q, limit)]


@app.get(
    "/api/historical/{ticker}",
    response_model=HistoricalResponse,
    responses={404: {"model": ErrorResponse}, 400: {"model": ErrorResponse}},
    tags=["market"],
)
def historical(
    ticker: str = Path(..., examples=["THYAO.IS"]),
    period: Period = Query("1y", description="Grafikte gösterilecek dönem"),
) -> HistoricalResponse:
    symbol = _resolve_ticker(ticker)
    try:
        df = get_processed_data(symbol)  # indikatörler 5 yıllık veride hesaplanır
    except DataFetchError as exc:
        raise _error(404, "data_not_found", str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("historical hata: %s", symbol)
        raise _error(500, "internal_error", f"Veri işlenirken beklenmeyen hata: {exc}") from exc

    cutoff = df.index.max() - pd.Timedelta(days=PERIOD_DAYS[period])
    view = df[df.index >= cutoff]
    last_year = df[df.index >= df.index.max() - pd.Timedelta(days=365)]
    last, prev = df.iloc[-1], df.iloc[-2]

    summary = HistoricalSummary(
        last_close=round(float(last["Close"]), 2),
        prev_close=round(float(prev["Close"]), 2),
        change=round(float(last["Close"] - prev["Close"]), 2),
        change_pct=round(float(last["Close"] / prev["Close"] - 1) * 100, 2),
        period_return_pct=round(float(view["Close"].iloc[-1] / view["Close"].iloc[0] - 1) * 100, 2),
        high_52w=round(float(last_year["High"].max()), 2),
        low_52w=round(float(last_year["Low"].min()), 2),
        volume=float(last["Volume"]),
        avg_volume_20=round(float(df["Volume"].iloc[-20:].mean()), 0),
    )

    data = [
        StockDataPoint(
            date=idx.strftime("%Y-%m-%d"),
            open=round(r.Open, 4), high=round(r.High, 4), low=round(r.Low, 4), close=round(r.Close, 4),
            volume=float(r.Volume),
            sma_20=round(r.SMA_20, 4), sma_50=round(r.SMA_50, 4), rsi_14=round(r.RSI_14, 2),
            macd=round(r.MACD, 4), macd_signal=round(r.MACD_Signal, 4), macd_hist=round(r.MACD_Hist, 4),
            bb_upper=round(r.BB_Upper, 4), bb_lower=round(r.BB_Lower, 4), atr_14=round(r.ATR_14, 4),
        )
        for idx, r in zip(view.index, view.itertuples(index=False))
    ]
    return HistoricalResponse(
        ticker=symbol, name=company_name(symbol), period=period, count=len(data), summary=summary, data=data
    )


@app.get(
    "/api/predict/{ticker}",
    response_model=PredictionResponse,
    responses={404: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
    tags=["ml"],
)
def predict(ticker: str = Path(..., examples=["THYAO.IS"])) -> PredictionResponse:
    symbol = _resolve_ticker(ticker)
    if not ml_model.model_available():
        state = ml_model.training_state["status"]
        msg = "Model şu anda eğitiliyor, lütfen birkaç dakika sonra tekrar deneyin." if state == "training" \
            else "Model henüz hazır değil. /api/model/train ile eğitimi başlatın."
        raise _error(503, "model_not_ready", msg)
    try:
        result = ml_model.predict(symbol)
    except DataFetchError as exc:
        raise _error(404, "data_not_found", str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("predict hata: %s", symbol)
        raise _error(500, "prediction_failed", f"Tahmin üretilemedi: {exc}") from exc
    return PredictionResponse(name=company_name(symbol), **result)


@app.get("/api/model/info", response_model=ModelInfoResponse, responses={503: {"model": ErrorResponse}}, tags=["ml"])
def model_info() -> ModelInfoResponse:
    if not ml_model.model_available():
        raise _error(503, "model_not_ready", "Model henüz hazır değil.")
    b = ml_model.load_model()
    return ModelInfoResponse(
        version=b["version"], trained_at=b["trained_at"], tickers=b["tickers"],
        train_size=b["train_size"], test_size=b["test_size"], test_period=b["test_period"],
        metrics=b["metrics"], feature_importances=b["feature_importances"],
    )


@app.post("/api/model/train", response_model=TrainingStatus, status_code=202, tags=["ml"])
def train(x_admin_token: str | None = Header(default=None)) -> TrainingStatus:
    if ADMIN_TOKEN and x_admin_token != ADMIN_TOKEN:
        raise _error(401, "unauthorized", "Geçersiz yönetici anahtarı.")
    if not ml_model.start_background_training(force=True):
        raise _error(409, "already_training", "Eğitim zaten devam ediyor.")
    return TrainingStatus(**ml_model.training_state)
