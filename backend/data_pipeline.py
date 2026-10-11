"""
Data Pipeline & Feature Engineering
-----------------------------------
yfinance ile hisse verisini çeker, eksik değerleri temizler ve
teknik indikatörleri (SMA_20, SMA_50, RSI_14, MACD, Bollinger, ATR) hesaplar.

Aynı sembol kısa süre içinde tekrar istendiğinde yfinance'a gitmemek için
bellek içi TTL önbelleği kullanılır (DATA_CACHE_TTL saniye, varsayılan 900).
"""

from __future__ import annotations

import logging
import os
import threading
import time

import numpy as np
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

PRICE_COLUMNS = ["Open", "High", "Low", "Close", "Volume"]
MARKET_INDEX = "XU100.IS"
CACHE_TTL_SECONDS = int(os.getenv("DATA_CACHE_TTL", "900"))

_cache: dict[tuple[str, str], tuple[float, pd.DataFrame]] = {}
_cache_lock = threading.Lock()


class DataFetchError(Exception):
    """yfinance veri çekemediğinde veya veri boş döndüğünde fırlatılır."""


def normalize_ticker(ticker: str) -> str:
    """'thyao' -> 'THYAO.IS'. Nokta veya ^ içeren semboller olduğu gibi bırakılır."""
    t = (ticker or "").strip().upper()
    if not t:
        raise ValueError("Hisse sembolü boş olamaz.")
    if "." not in t and not t.startswith("^"):
        t = f"{t}.IS"
    return t


# ---------------------------------------------------------------------------
# Veri çekme
# ---------------------------------------------------------------------------
def fetch_stock_data(ticker: str, period: str = "5y", interval: str = "1d") -> pd.DataFrame:
    """Verilen sembol için (varsayılan: son 5 yıl, günlük) OHLCV verisini çeker."""
    ticker = normalize_ticker(ticker)
    yf_period = "5d" if period == "1w" else period
    key = (ticker, f"{period}:{interval}")
    with _cache_lock:
        hit = _cache.get(key)
        if hit and time.time() - hit[0] < CACHE_TTL_SECONDS:
            return hit[1].copy()

    try:
        df = yf.download(
            ticker,
            period=yf_period,
            interval=interval,
            auto_adjust=False,
            progress=False,
            threads=False,
        )
    except Exception as exc:  # ağ hataları vb.
        raise DataFetchError(f"'{ticker}' için veri çekilirken hata oluştu: {exc}") from exc

    if df is None or df.empty:
        raise DataFetchError(f"'{ticker}' için veri bulunamadı. Sembolü kontrol edin (örn. THYAO.IS).")

    # Yeni yfinance sürümleri tek sembolde de MultiIndex kolon döndürebilir.
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    missing = [c for c in PRICE_COLUMNS if c not in df.columns]
    if missing:
        raise DataFetchError(f"'{ticker}' verisinde eksik kolonlar var: {missing}")

    df = df[PRICE_COLUMNS].copy()
    df.index = pd.to_datetime(df.index).tz_localize(None)
    df.index.name = "Date"
    with _cache_lock:
        _cache[key] = (time.time(), df)
    return df.copy()


def fetch_market_returns(period: str = "5y") -> pd.DataFrame:
    """BIST100 endeksinin kapanış serisini döndürür (piyasa bağlamı özellikleri için)."""
    df = clean_data(fetch_stock_data(MARKET_INDEX, period=period))
    return df[["Close"]].rename(columns={"Close": "MKT_Close"})


# ---------------------------------------------------------------------------
# Temizleme
# ---------------------------------------------------------------------------
def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Eksik değerleri doldurur, tekrar eden ve geçersiz satırları temizler."""
    df = df.copy()
    df = df[~df.index.duplicated(keep="last")].sort_index()
    df = df.replace([np.inf, -np.inf], np.nan)

    # Fiyatlarda ileri/geri doldurma, hacimde 0 ile doldurma
    price_cols = ["Open", "High", "Low", "Close"]
    df[price_cols] = df[price_cols].ffill().bfill()
    df["Volume"] = df["Volume"].fillna(0)

    # Tamamen geçersiz (fiyatı <= 0) satırları at
    df = df[(df[price_cols] > 0).all(axis=1)]
    return df.dropna()


# ---------------------------------------------------------------------------
# İndikatörler
# ---------------------------------------------------------------------------
def compute_sma(series: pd.Series, window: int) -> pd.Series:
    return series.rolling(window=window, min_periods=window).mean()


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """Wilder yumuşatmalı RSI."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    # avg_loss == 0 ise RSI = 100
    rsi = rsi.where(avg_loss != 0, 100.0)
    return rsi


def compute_macd(
    series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> tuple[pd.Series, pd.Series, pd.Series]:
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd = ema_fast - ema_slow
    macd_signal = macd.ewm(span=signal, adjust=False).mean()
    macd_hist = macd - macd_signal
    return macd, macd_signal, macd_hist


def compute_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Average True Range (Wilder)."""
    prev_close = df["Close"].shift(1)
    tr = pd.concat(
        [df["High"] - df["Low"], (df["High"] - prev_close).abs(), (df["Low"] - prev_close).abs()],
        axis=1,
    ).max(axis=1)
    return tr.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()


def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """SMA_20, SMA_50, RSI_14, MACD(+Signal/Hist), BB_Upper/BB_Lower, ATR_14 kolonlarını ekler."""
    df = df.copy()
    close = df["Close"]
    df["SMA_20"] = compute_sma(close, min(20, max(2, len(df))))
    # SMA_50: 50 günden kısa veri setlerinde SMA_20'yi yedek olarak kullan
    sma50 = compute_sma(close, 50)
    df["SMA_50"] = sma50.fillna(df["SMA_20"])
    df["RSI_14"] = compute_rsi(close, min(14, max(2, len(df))))
    df["MACD"], df["MACD_Signal"], df["MACD_Hist"] = compute_macd(close)
    std20 = close.rolling(min(20, max(2, len(df))), min_periods=2).std().fillna(0.0)
    df["BB_Upper"] = df["SMA_20"] + 2 * std20
    df["BB_Lower"] = df["SMA_20"] - 2 * std20
    df["ATR_14"] = compute_atr(df, min(14, max(2, len(df))))
    # İndikatör ısınma periyodundan kaynaklanan NaN satırlarını bfill/ffill ile kurtar veya son satırları koru
    df = df.bfill().ffill()
    return df.dropna()


# ---------------------------------------------------------------------------
# Ana giriş noktası
# ---------------------------------------------------------------------------
def get_processed_data(ticker: str, period: str = "5y") -> pd.DataFrame:
    """Veriyi çeker, temizler ve indikatörleri ekleyerek döndürür."""
    raw = fetch_stock_data(ticker, period=period)
    cleaned = clean_data(raw)
    processed = add_indicators(cleaned)
    if processed.empty:
        raise DataFetchError(f"'{ticker}' için indikatör hesaplamaya yetecek veri yok.")
    logger.info("%s: %d satır işlendi.", ticker, len(processed))
    return processed


if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO)
    symbol = sys.argv[1] if len(sys.argv) > 1 else "THYAO.IS"
    data = get_processed_data(symbol)
    pd.set_option("display.width", 200)
    print(f"\n{symbol} - {len(data)} satır, {data.index.min().date()} -> {data.index.max().date()}")
    print(data.tail(10).round(2))
