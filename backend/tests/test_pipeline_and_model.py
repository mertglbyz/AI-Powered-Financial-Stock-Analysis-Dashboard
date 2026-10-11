"""Ağ bağlantısı gerektirmeyen birim testleri (sentetik veri ile)."""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from data_pipeline import add_indicators, clean_data, compute_rsi  # noqa: E402
from ml_model import (  # noqa: E402
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    build_features,
    chronological_split,
    create_model,
    evaluate,
)


@pytest.fixture
def synthetic_ohlcv() -> pd.DataFrame:
    rng = np.random.default_rng(0)
    n = 400
    idx = pd.bdate_range("2022-01-03", periods=n, name="Date")
    close = 100 * np.exp(np.cumsum(rng.normal(0, 0.015, n)))
    df = pd.DataFrame(
        {
            "Open": close * (1 + rng.normal(0, 0.003, n)),
            "High": close * 1.01,
            "Low": close * 0.99,
            "Close": close,
            "Volume": rng.integers(1_000, 10_000, n).astype(float),
        },
        index=idx,
    )
    df.iloc[10, df.columns.get_loc("Close")] = np.nan  # eksik değer
    return df


def test_clean_data_removes_nan(synthetic_ohlcv):
    cleaned = clean_data(synthetic_ohlcv)
    assert not cleaned.isna().any().any()
    assert len(cleaned) == len(synthetic_ohlcv)


def test_indicators_added(synthetic_ohlcv):
    df = add_indicators(clean_data(synthetic_ohlcv))
    for col in ["SMA_20", "SMA_50", "RSI_14", "MACD", "MACD_Signal", "MACD_Hist"]:
        assert col in df.columns
    assert not df.isna().any().any()
    assert df["RSI_14"].between(0, 100).all()
    # SMA_20 son değer kontrolü
    assert np.isclose(df["SMA_20"].iloc[-1], df["Close"].iloc[-20:].mean())


def test_rsi_all_gains_is_100():
    s = pd.Series(np.arange(1, 40, dtype=float))
    assert compute_rsi(s).dropna().eq(100).all()


def test_build_features_and_split(synthetic_ohlcv):
    feats = build_features(add_indicators(clean_data(synthetic_ohlcv)))
    assert set(FEATURE_COLUMNS).issubset(feats.columns)
    assert np.isnan(feats[TARGET_COLUMN].iloc[-1])  # yarın bilinmiyor
    train, test = chronological_split(feats)
    assert train.index.max() < test.index.min()  # zaman sızıntısı yok
    assert abs(len(train) / (len(train) + len(test)) - 0.8) < 0.01


def test_model_trains_and_evaluates(synthetic_ohlcv):
    feats = build_features(add_indicators(clean_data(synthetic_ohlcv)))
    train, test = chronological_split(feats)
    model = create_model().set_params(n_estimators=20)
    model.fit(train[FEATURE_COLUMNS], train[TARGET_COLUMN])
    result = evaluate(model, test)
    assert 0 <= result.directional_accuracy <= 1
    assert result.mae_price >= 0
