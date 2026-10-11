"""
ML Model
--------
data_pipeline.py'den gelen indikatörlü veriyle bir RandomForestRegressor eğitir.

Tasarım:
- Hedef değişken: 1 gün sonraki kapanışın bugüne göre getirisi
  (target = Close.shift(-1) / Close - 1). Tahmin edilen fiyat = Close * (1 + tahmin).
- Özellikler ölçekten bağımsızdır (oranlar, yüzdeler, normalize MACD); bu sayede
  birden çok hisseyle eğitilen tek bir model herhangi bir hisse için kullanılabilir.
- Veri her hisse için kronolojik olarak %80 eğitim / %20 test şeklinde ayrılır
  (zaman serisinde karıştırma yapılmaz -> geleceğe sızıntı engellenir).
- Model `joblib` ile model.pkl olarak kaydedilir. Sadece dosya yoksa veya
  force=True ile manuel tetiklenirse yeniden eğitim yapılır.
"""

from __future__ import annotations

import argparse
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

from data_pipeline import DataFetchError, get_processed_data

logger = logging.getLogger(__name__)

MODEL_PATH = Path(os.getenv("MODEL_PATH", Path(__file__).resolve().parent / "model.pkl"))

DEFAULT_TRAINING_TICKERS: list[str] = [
    "THYAO.IS", "PGSUS.IS", "GARAN.IS", "AKBNK.IS", "ASELS.IS",
    "BIMAS.IS", "KCHOL.IS", "SISE.IS", "EREGL.IS", "TUPRS.IS",
]

FEATURE_COLUMNS: list[str] = [
    "ret_1", "ret_5", "ret_10",
    "close_sma20", "close_sma50", "sma20_sma50",
    "rsi",
    "macd_n", "macd_signal_n", "macd_hist_n",
    "volatility_10", "hl_range", "volume_ratio",
]
TARGET_COLUMN = "target_return"
TRAIN_RATIO = 0.8

_model_cache: dict[str, Any] | None = None


# ---------------------------------------------------------------------------
# Özellik mühendisliği
# ---------------------------------------------------------------------------
def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """İndikatörlü DataFrame'den ölçekten bağımsız ML özellikleri ve hedef üretir.

    Son satırın hedefi NaN'dır (yarın henüz bilinmiyor) – bu satır tahmin için kullanılır.
    """
    out = pd.DataFrame(index=df.index)
    close = df["Close"]

    out["ret_1"] = close.pct_change(1)
    out["ret_5"] = close.pct_change(5)
    out["ret_10"] = close.pct_change(10)
    out["close_sma20"] = close / df["SMA_20"] - 1
    out["close_sma50"] = close / df["SMA_50"] - 1
    out["sma20_sma50"] = df["SMA_20"] / df["SMA_50"] - 1
    out["rsi"] = df["RSI_14"] / 100.0
    out["macd_n"] = df["MACD"] / close
    out["macd_signal_n"] = df["MACD_Signal"] / close
    out["macd_hist_n"] = df["MACD_Hist"] / close
    out["volatility_10"] = out["ret_1"].rolling(10).std()
    out["hl_range"] = (df["High"] - df["Low"]) / close
    vol_mean = df["Volume"].rolling(20).mean()
    out["volume_ratio"] = (df["Volume"] / vol_mean.replace(0, np.nan)) - 1

    out[TARGET_COLUMN] = close.shift(-1) / close - 1
    out["Close"] = close

    out = out.replace([np.inf, -np.inf], np.nan)
    # Özelliklerde NaN olan (ısınma) satırları at; hedefteki son NaN korunur.
    return out.dropna(subset=FEATURE_COLUMNS)


def chronological_split(features: pd.DataFrame, train_ratio: float = TRAIN_RATIO) -> tuple[pd.DataFrame, pd.DataFrame]:
    labeled = features.dropna(subset=[TARGET_COLUMN])
    split_idx = int(len(labeled) * train_ratio)
    return labeled.iloc[:split_idx], labeled.iloc[split_idx:]


# ---------------------------------------------------------------------------
# Eğitim
# ---------------------------------------------------------------------------
def create_model() -> RandomForestRegressor:
    return RandomForestRegressor(
        n_estimators=300,
        max_depth=8,
        min_samples_leaf=20,
        max_features="sqrt",
        n_jobs=-1,
        random_state=42,
    )


@dataclass
class EvalResult:
    mae_return: float
    rmse_return: float
    directional_accuracy: float
    mae_price: float
    baseline_mae_price: float  # "yarın = bugün" naive tahmini

    def to_dict(self) -> dict[str, float]:
        return {k: round(float(v), 6) for k, v in self.__dict__.items()}


def evaluate(model: RandomForestRegressor, test: pd.DataFrame) -> EvalResult:
    y_true = test[TARGET_COLUMN].to_numpy()
    y_pred = model.predict(test[FEATURE_COLUMNS])
    close = test["Close"].to_numpy()
    true_price = close * (1 + y_true)
    pred_price = close * (1 + y_pred)
    return EvalResult(
        mae_return=mean_absolute_error(y_true, y_pred),
        rmse_return=float(np.sqrt(mean_squared_error(y_true, y_pred))),
        directional_accuracy=float(np.mean(np.sign(y_true) == np.sign(y_pred))),
        mae_price=mean_absolute_error(true_price, pred_price),
        baseline_mae_price=mean_absolute_error(true_price, close),
    )


def train_model(tickers: list[str] | None = None, save_path: Path = MODEL_PATH) -> dict[str, Any]:
    """Verilen hisselerle modeli eğitir, test eder ve model.pkl olarak kaydeder."""
    tickers = tickers or DEFAULT_TRAINING_TICKERS
    train_parts, test_parts, used = [], [], []

    for t in tickers:
        try:
            feats = build_features(get_processed_data(t))
        except (DataFetchError, ValueError) as exc:
            logger.warning("%s atlandı: %s", t, exc)
            continue
        tr, te = chronological_split(feats)
        if len(tr) < 100 or te.empty:
            logger.warning("%s atlandı: yetersiz veri (%d satır).", t, len(feats))
            continue
        train_parts.append(tr)
        test_parts.append(te)
        used.append(t)
        logger.info("%s: train=%d test=%d", t, len(tr), len(te))

    if not train_parts:
        raise RuntimeError("Eğitim için hiçbir hisseden veri alınamadı.")

    train_df = pd.concat(train_parts)
    test_df = pd.concat(test_parts)

    model = create_model()
    model.fit(train_df[FEATURE_COLUMNS], train_df[TARGET_COLUMN])
    metrics = evaluate(model, test_df).to_dict()

    bundle: dict[str, Any] = {
        "model": model,
        "features": FEATURE_COLUMNS,
        "tickers": used,
        "metrics": metrics,
        "train_size": len(train_df),
        "test_size": len(test_df),
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }
    save_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, save_path)
    logger.info("Model kaydedildi: %s | metrikler: %s", save_path, metrics)

    global _model_cache
    _model_cache = bundle
    return bundle


# ---------------------------------------------------------------------------
# Yükleme & tahmin
# ---------------------------------------------------------------------------
def load_model(path: Path = MODEL_PATH, force_retrain: bool = False) -> dict[str, Any]:
    """Modeli bellekten/diskten yükler. Yoksa (veya force_retrain) eğitir."""
    global _model_cache
    if force_retrain or not path.exists():
        logger.info("Model eğitimi başlatılıyor (force=%s, mevcut=%s).", force_retrain, path.exists())
        return train_model(save_path=path)
    if _model_cache is None:
        _model_cache = joblib.load(path)
    return _model_cache


def predict(ticker: str, bundle: dict[str, Any] | None = None) -> dict[str, Any]:
    """Hissenin en güncel verisiyle ertesi günün kapanış fiyatını tahmin eder."""
    bundle = bundle or load_model()
    model: RandomForestRegressor = bundle["model"]

    df = get_processed_data(ticker)
    feats = build_features(df)
    if feats.empty:
        raise DataFetchError(f"'{ticker}' için tahmin üretecek yeterli veri yok.")

    latest = feats.iloc[[-1]]
    x = latest[bundle["features"]]
    pred_return = float(model.predict(x)[0])

    # Ağaçların yön konusunda ne kadar hemfikir olduğu -> basit güven skoru
    tree_preds = np.array([est.predict(x.to_numpy())[0] for est in model.estimators_])
    agreement = float(np.mean(np.sign(tree_preds) == np.sign(pred_return)))

    last_close = float(latest["Close"].iloc[0])
    return {
        "ticker": ticker.strip().upper(),
        "last_close": round(last_close, 2),
        "last_date": latest.index[0].strftime("%Y-%m-%d"),
        "predicted_price": round(last_close * (1 + pred_return), 2),
        "predicted_change_pct": round(pred_return * 100, 3),
        "trend": "BULLISH" if pred_return > 0 else "BEARISH",
        "confidence": round(agreement, 3),
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def _main() -> None:
    parser = argparse.ArgumentParser(description="Stock ML model eğitim/tahmin aracı")
    parser.add_argument("--train", action="store_true", help="Modeli (yeniden) eğit")
    parser.add_argument("--predict", metavar="TICKER", help="Verilen hisse için tahmin yap")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    if args.train:
        bundle = train_model()
        print("\nEgitim tamamlandi.")
        print(f"Hisseler : {bundle['tickers']}")
        print(f"Train/Test: {bundle['train_size']}/{bundle['test_size']}")
        for k, v in bundle["metrics"].items():
            print(f"  {k:22s}: {v}")

    if args.predict:
        print("\nTahmin:", predict(args.predict))

    if not args.train and not args.predict:
        parser.print_help()


if __name__ == "__main__":
    _main()
