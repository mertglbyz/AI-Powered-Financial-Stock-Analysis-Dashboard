"""
Data Pipeline & Feature Engineering
-----------------------------------
yfinance ile hisse verisini çeker, eksik değerleri temizler ve
teknik indikatörleri (SMA_20, SMA_50, RSI_14, MACD) hesaplar.
"""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

PRICE_COLUMNS = ["Open", "High", "Low", "Close", "Volume"]


class DataFetchError(Exception):
    """yfinance veri çekemediğinde veya veri boş döndüğünde fırlatılır."""


# ---------------------------------------------------------------------------
# Veri çekme
# ---------------------------------------------------------------------------
def fetch_stock_data(ticker: str, period: str = "5y", interval: str = "1d") -> pd.DataFrame:
    """Verilen sembol için (varsayılan: son 5 yıl, günlük) OHLCV verisini çeker."""
    ticker = ticker.strip().upper()
    if not ticker:
        raise ValueError("Hisse sembolü boş olamaz.")

    try:
        df = yf.download(
            ticker,
            period=period,
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
    return df


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


def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """SMA_20, SMA_50, RSI_14, MACD, MACD_Signal, MACD_Hist kolonlarını ekler."""
    df = df.copy()
    close = df["Close"]
    df["SMA_20"] = compute_sma(close, 20)
    df["SMA_50"] = compute_sma(close, 50)
    df["RSI_14"] = compute_rsi(close, 14)
    df["MACD"], df["MACD_Signal"], df["MACD_Hist"] = compute_macd(close)
    # İndikatör ısınma periyodundan kaynaklanan NaN satırlarını at
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
