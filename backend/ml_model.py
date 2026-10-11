"""
ML Model (v2)
-------------
data_pipeline.py'den gelen indikatörlü veriyle iki model eğitir:

1. RandomForestRegressor  -> 1 gün sonraki getiri (tahmini fiyat + güven aralığı)
2. RandomForestClassifier -> 1 gün sonra yükseliş olasılığı (trend + güven)

Tasarım:
- Hedef: target_return = Close.shift(-1) / Close - 1   (target_up = target_return > 0)
- Özellikler ölçekten bağımsızdır (oranlar, getiriler, normalize MACD/ATR) ve BIST100
  endeksinden piyasa bağlamı içerir. Bu sayede BIST30 sepetiyle eğitilen TEK bir model,
  BIST'teki herhangi bir hisse için tahmin üretebilir.
- Değerlendirme: her hisse kronolojik olarak %80 eğitim / %20 test ayrılır (shuffle yok).
  Raporlanan metrikler test (holdout) setine aittir. Ardından üretim modeli tüm etiketli
  veriyle yeniden eğitilir (en güncel piyasa rejimini de öğrenmesi için).
- Kayıt: joblib ile model.pkl. Sadece dosya yoksa, sürüm uyuşmuyorsa veya manuel
  tetiklenirse yeniden eğitim yapılır.
"""

from __future__ import annotations

import argparse
import logging
import os
import threading
from concurrent.futures import ThreadPoolExecutor
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_absolute_error, mean_squared_error, roc_auc_score

from bist_tickers import BIST30
from data_pipeline import DataFetchError, fetch_market_returns, get_processed_data, normalize_ticker

logger = logging.getLogger(__name__)

MODEL_VERSION = 2
MODEL_PATH = Path(os.getenv("MODEL_PATH", Path(__file__).resolve().parent / "model.pkl"))
DEFAULT_TRAINING_TICKERS: list[str] = [f"{c}.IS" for c in BIST30]

FEATURE_COLUMNS: list[str] = [
    # momentum
    "ret_1", "ret_5", "ret_10", "ret_20",
    # trend
    "close_sma20", "close_sma50", "sma20_sma50",
    # osilatörler
    "rsi", "macd_n", "macd_signal_n", "macd_hist_n", "bb_pct",
    # volatilite & hacim
    "volatility_10", "atr_n", "hl_range", "volume_ratio",
    # piyasa bağlamı (BIST100)
    "mkt_ret_1", "mkt_ret_5", "mkt_ret_20", "mkt_close_sma50", "rel_strength_20",
]
TARGET_COLUMN = "target_return"
TARGET_UP = "target_up"
TRAIN_RATIO = 0.8
BULLISH_THRESHOLD = 0.55
BEARISH_THRESHOLD = 0.45

_model_cache: dict[str, Any] | None = None
_model_lock = threading.Lock()

# API'nin eğitim durumunu takip edebilmesi için
training_state: dict[str, Any] = {"status": "idle", "started_at": None, "finished_at": None, "error": None}


# ---------------------------------------------------------------------------
# Özellik mühendisliği
# ---------------------------------------------------------------------------
def build_features(df: pd.DataFrame, market: pd.DataFrame | None = None) -> pd.DataFrame:
    """İndikatörlü DataFrame'den ML özellikleri ve hedefleri üretir.

    market: `fetch_market_returns()` çıktısı (MKT_Close kolonu). None ise piyasa
    özellikleri 0 kabul edilir. Son satırın hedefi NaN'dır (yarın bilinmiyor).
    """
    out = pd.DataFrame(index=df.index)
    close = df["Close"]

    out["ret_1"] = close.pct_change(1)
    out["ret_5"] = close.pct_change(5)
    out["ret_10"] = close.pct_change(10)
    out["ret_20"] = close.pct_change(20)
    out["close_sma20"] = close / df["SMA_20"] - 1
    out["close_sma50"] = close / df["SMA_50"] - 1
    out["sma20_sma50"] = df["SMA_20"] / df["SMA_50"] - 1
    out["rsi"] = df["RSI_14"] / 100.0
    out["macd_n"] = df["MACD"] / close
    out["macd_signal_n"] = df["MACD_Signal"] / close
    out["macd_hist_n"] = df["MACD_Hist"] / close
    band = (df["BB_Upper"] - df["BB_Lower"]).replace(0, np.nan)
    out["bb_pct"] = (close - df["BB_Lower"]) / band
    out["volatility_10"] = out["ret_1"].rolling(10).std()
    out["atr_n"] = df["ATR_14"] / close
    out["hl_range"] = (df["High"] - df["Low"]) / close
    vol_mean = df["Volume"].rolling(20).mean()
    out["volume_ratio"] = (df["Volume"] / vol_mean.replace(0, np.nan)) - 1

    if market is not None and not market.empty:
        mkt = market["MKT_Close"].reindex(df.index).ffill()
        out["mkt_ret_1"] = mkt.pct_change(1)
        out["mkt_ret_5"] = mkt.pct_change(5)
        out["mkt_ret_20"] = mkt.pct_change(20)
        out["mkt_close_sma50"] = mkt / mkt.rolling(50).mean() - 1
    else:
        for c in ["mkt_ret_1", "mkt_ret_5", "mkt_ret_20", "mkt_close_sma50"]:
            out[c] = 0.0
    out["rel_strength_20"] = out["ret_20"] - out["mkt_ret_20"]

    out[TARGET_COLUMN] = close.shift(-1) / close - 1
    out[TARGET_UP] = (out[TARGET_COLUMN] > 0).astype(float).where(out[TARGET_COLUMN].notna())
    out["Close"] = close

    out = out.replace([np.inf, -np.inf], np.nan)
    # Özelliklerde NaN olan (ısınma) satırları at; hedefteki son NaN korunur.
    return out.dropna(subset=FEATURE_COLUMNS)


def chronological_split(features: pd.DataFrame, train_ratio: float = TRAIN_RATIO) -> tuple[pd.DataFrame, pd.DataFrame]:
    labeled = features.dropna(subset=[TARGET_COLUMN])
    split_idx = int(len(labeled) * train_ratio)
    return labeled.iloc[:split_idx], labeled.iloc[split_idx:]


# ---------------------------------------------------------------------------
# Modeller
# ---------------------------------------------------------------------------
def create_regressor() -> RandomForestRegressor:
    return RandomForestRegressor(
        n_estimators=300, max_depth=8, min_samples_leaf=30,
        max_features="sqrt", n_jobs=-1, random_state=42,
    )


def create_classifier() -> RandomForestClassifier:
    return RandomForestClassifier(
        n_estimators=400, max_depth=7, min_samples_leaf=40,
        max_features="sqrt", class_weight="balanced_subsample",
        n_jobs=-1, random_state=42,
    )


# Geriye dönük uyumluluk (Phase 2 testleri / API)
create_model = create_regressor


@dataclass
class EvalResult:
    # Regresyon (getiri/fiyat)
    mae_return: float
    rmse_return: float
    mae_price: float
    baseline_mae_price: float          # "yarın = bugün" naive tahmini
    # Sınıflandırma (yön)
    directional_accuracy: float
    baseline_accuracy: float           # test setindeki çoğunluk sınıfı oranı
    roc_auc: float
    confident_accuracy: float          # olasılık >= 0.55 veya <= 0.45 olduğunda doğruluk
    confident_coverage: float          # bu güvenli sinyallerin oranı
    long_signal_avg_return: float      # model "yükseliş" dediğinde ortalama ertesi gün getirisi
    all_days_avg_return: float         # tüm günlerin ortalama getirisi (kıyas)

    def to_dict(self) -> dict[str, float]:
        return {k: round(float(v), 6) for k, v in asdict(self).items()}


def evaluate(reg: RandomForestRegressor, test: pd.DataFrame, clf: RandomForestClassifier | None = None) -> EvalResult:
    x = test[FEATURE_COLUMNS]
    y_true = test[TARGET_COLUMN].to_numpy()
    y_pred = reg.predict(x)
    close = test["Close"].to_numpy()
    true_price, pred_price = close * (1 + y_true), close * (1 + y_pred)

    up_true = (y_true > 0).astype(int)
    if clf is not None:
        proba = clf.predict_proba(x)[:, list(clf.classes_).index(1.0)]
    else:  # sınıflandırıcı yoksa regresyon işaretinden türet
        proba = (y_pred > 0).astype(float)
    up_pred = (proba >= 0.5).astype(int)
    confident = (proba >= BULLISH_THRESHOLD) | (proba <= BEARISH_THRESHOLD)
    long_mask = proba >= BULLISH_THRESHOLD

    try:
        auc = roc_auc_score(up_true, proba)
    except ValueError:
        auc = float("nan")

    return EvalResult(
        mae_return=mean_absolute_error(y_true, y_pred),
        rmse_return=float(np.sqrt(mean_squared_error(y_true, y_pred))),
        mae_price=mean_absolute_error(true_price, pred_price),
        baseline_mae_price=mean_absolute_error(true_price, close),
        directional_accuracy=accuracy_score(up_true, up_pred),
        baseline_accuracy=max(up_true.mean(), 1 - up_true.mean()),
        roc_auc=auc,
        confident_accuracy=accuracy_score(up_true[confident], up_pred[confident]) if confident.any() else float("nan"),
        confident_coverage=float(confident.mean()),
        long_signal_avg_return=float(y_true[long_mask].mean()) if long_mask.any() else float("nan"),
        all_days_avg_return=float(y_true.mean()),
    )


# ---------------------------------------------------------------------------
# Eğitim
# ---------------------------------------------------------------------------
def _safe_market() -> pd.DataFrame | None:
    try:
        return fetch_market_returns()
    except (DataFetchError, ValueError) as exc:
        logger.warning("BIST100 verisi alınamadı, piyasa özellikleri 0 kabul edilecek: %s", exc)
        return None


def _load_features(ticker: str, market: pd.DataFrame | None) -> tuple[str, pd.DataFrame | None]:
    try:
        return ticker, build_features(get_processed_data(ticker), market)
    except (DataFetchError, ValueError) as exc:
        logger.warning("%s atlandı: %s", ticker, exc)
        return ticker, None


def train_model(tickers: list[str] | None = None, save_path: Path | None = None) -> dict[str, Any]:
    """Modelleri eğitir, holdout ile test eder, tüm veriyle yeniden eğitir ve kaydeder."""
    save_path = save_path or MODEL_PATH
    tickers = tickers or DEFAULT_TRAINING_TICKERS
    market = _safe_market()

    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda t: _load_features(t, market), tickers))

    train_parts, test_parts, used = [], [], []
    for t, feats in results:
        if feats is None:
            continue
        tr, te = chronological_split(feats)
        if len(tr) < 200 or te.empty:
            logger.warning("%s atlandı: yetersiz veri (%d satır).", t, len(feats))
            continue
        train_parts.append(tr)
        test_parts.append(te)
        used.append(t)

    if not train_parts:
        raise RuntimeError("Eğitim için hiçbir hisseden veri alınamadı.")

    train_df, test_df = pd.concat(train_parts), pd.concat(test_parts)
    logger.info("Eğitim: %d hisse, train=%d, test=%d", len(used), len(train_df), len(test_df))

    # 1) Holdout değerlendirmesi
    reg, clf = create_regressor(), create_classifier()
    reg.fit(train_df[FEATURE_COLUMNS], train_df[TARGET_COLUMN])
    clf.fit(train_df[FEATURE_COLUMNS], train_df[TARGET_UP])
    metrics = evaluate(reg, test_df, clf).to_dict()
    logger.info("Holdout metrikleri: %s", metrics)

    # 2) Üretim modeli: tüm etiketli veriyle yeniden eğitim
    full_df = pd.concat([train_df, test_df])
    reg_full, clf_full = create_regressor(), create_classifier()
    reg_full.fit(full_df[FEATURE_COLUMNS], full_df[TARGET_COLUMN])
    clf_full.fit(full_df[FEATURE_COLUMNS], full_df[TARGET_UP])

    importances = sorted(
        zip(FEATURE_COLUMNS, clf_full.feature_importances_), key=lambda x: x[1], reverse=True
    )

    bundle: dict[str, Any] = {
        "version": MODEL_VERSION,
        "regressor": reg_full,
        "classifier": clf_full,
        "features": FEATURE_COLUMNS,
        "tickers": used,
        "metrics": metrics,
        "feature_importances": [{"feature": f, "importance": round(float(i), 5)} for f, i in importances],
        "train_size": len(train_df),
        "test_size": len(test_df),
        "test_period": {
            "start": test_df.index.min().strftime("%Y-%m-%d"),
            "end": test_df.index.max().strftime("%Y-%m-%d"),
        },
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }
    save_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, save_path, compress=3)
    logger.info("Model kaydedildi: %s", save_path)

    global _model_cache
    with _model_lock:
        _model_cache = bundle
    return bundle


def start_background_training(force: bool = False) -> bool:
    """Eğitimi arka planda başlatır. Zaten eğitim sürüyorsa False döner."""
    if training_state["status"] == "training":
        return False
    if not force and model_available():
        return False

    def _run() -> None:
        training_state.update(status="training", started_at=datetime.now(timezone.utc).isoformat(),
                              finished_at=None, error=None)
        try:
            train_model()
            training_state.update(status="ready")
        except Exception as exc:  # noqa: BLE001
            logger.exception("Eğitim başarısız")
            training_state.update(status="error", error=str(exc))
        finally:
            training_state["finished_at"] = datetime.now(timezone.utc).isoformat()

    threading.Thread(target=_run, daemon=True, name="model-training").start()
    return True


# ---------------------------------------------------------------------------
# Yükleme & tahmin
# ---------------------------------------------------------------------------
def model_available(path: Path | None = None) -> bool:
    global _model_cache
    path = path or MODEL_PATH
    if _model_cache is not None:
        return True
    if not path.exists():
        return False
    try:
        bundle = joblib.load(path)
    except Exception:  # noqa: BLE001 – bozuk dosya
        return False
    if bundle.get("version") != MODEL_VERSION:
        return False
    with _model_lock:
        _model_cache = bundle
    return True


def load_model(path: Path | None = None, force_retrain: bool = False) -> dict[str, Any]:
    """Modeli bellekten/diskten yükler. Yoksa, sürümü eskiyse veya force_retrain ise eğitir."""
    global _model_cache
    path = path or MODEL_PATH
    if force_retrain:
        return train_model(save_path=path)
    with _model_lock:
        if _model_cache is not None:
            return _model_cache
        if path.exists():
            bundle = joblib.load(path)
            if bundle.get("version") == MODEL_VERSION:
                _model_cache = bundle
                return bundle
            logger.info("Model sürümü eski (%s), yeniden eğitilecek.", bundle.get("version"))
    return train_model(save_path=path)


def technical_signals(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Son güne ait kural tabanlı teknik sinyal özeti (UI için)."""
    last, prev = df.iloc[-1], df.iloc[-2]
    signals: list[dict[str, Any]] = []

    rsi = float(last["RSI_14"])
    if rsi >= 70:
        s, d = "BEARISH", "Aşırı alım bölgesi (RSI ≥ 70)"
    elif rsi <= 30:
        s, d = "BULLISH", "Aşırı satım bölgesi (RSI ≤ 30)"
    else:
        s, d = "NEUTRAL", "Nötr bölge (30 < RSI < 70)"
    signals.append({"name": "RSI (14)", "value": round(rsi, 2), "signal": s, "description": d})

    macd_up = last["MACD"] > last["MACD_Signal"]
    crossed = (prev["MACD"] > prev["MACD_Signal"]) != macd_up
    signals.append({
        "name": "MACD",
        "value": round(float(last["MACD_Hist"]), 4),
        "signal": "BULLISH" if macd_up else "BEARISH",
        "description": ("Yeni " if crossed else "") + ("pozitif kesişim (MACD > Sinyal)" if macd_up else "negatif kesişim (MACD < Sinyal)"),
    })

    above50 = last["Close"] > last["SMA_50"]
    signals.append({
        "name": "Fiyat / SMA 50",
        "value": round(float(last["Close"] / last["SMA_50"] - 1) * 100, 2),
        "signal": "BULLISH" if above50 else "BEARISH",
        "description": "Fiyat 50 günlük ortalamanın " + ("üzerinde" if above50 else "altında"),
    })

    golden = last["SMA_20"] > last["SMA_50"]
    signals.append({
        "name": "SMA 20 / SMA 50",
        "value": round(float(last["SMA_20"] / last["SMA_50"] - 1) * 100, 2),
        "signal": "BULLISH" if golden else "BEARISH",
        "description": "Kısa vadeli ortalama uzun vadelinin " + ("üzerinde (yükseliş trendi)" if golden else "altında (düşüş trendi)"),
    })

    bb_pos = (last["Close"] - last["BB_Lower"]) / max(last["BB_Upper"] - last["BB_Lower"], 1e-9)
    if bb_pos >= 1:
        s, d = "BEARISH", "Fiyat üst Bollinger bandının üzerinde"
    elif bb_pos <= 0:
        s, d = "BULLISH", "Fiyat alt Bollinger bandının altında"
    else:
        s, d = "NEUTRAL", "Fiyat Bollinger bantları içinde"
    signals.append({"name": "Bollinger %B", "value": round(float(bb_pos) * 100, 1), "signal": s, "description": d})
    return signals


STOCK_MODELS_DIR = Path(os.getenv("STOCK_MODELS_DIR", MODEL_PATH.parent / "stock_models"))
STOCK_MODELS_DIR.mkdir(parents=True, exist_ok=True)
_dedicated_cache: dict[str, dict[str, Any]] = {}
_dedicated_lock = threading.Lock()


def get_or_train_dedicated_model(ticker: str, force: bool = False) -> dict[str, Any]:
    """İlgili hissenin kendi 5 yıllık verisiyle hisseye özel RandomForest modeli eğitir / yükler."""
    ticker = normalize_ticker(ticker)
    clean_sym = ticker.replace(".IS", "")
    with _dedicated_lock:
        if not force and clean_sym in _dedicated_cache:
            return _dedicated_cache[clean_sym]

    model_file = STOCK_MODELS_DIR / f"{clean_sym}.pkl"
    if not force and model_file.exists():
        try:
            bundle = joblib.load(model_file)
            with _dedicated_lock:
                _dedicated_cache[clean_sym] = bundle
            return bundle
        except Exception:
            pass

    # Hisseye özel veriyi al ve model eğit
    df = get_processed_data(ticker)
    feats = build_features(df, _safe_market())
    tr, te = chronological_split(feats)
    if len(tr) < 80:
        raise DataFetchError(f"'{ticker}' için hisseye özel model eğitmeye yetecek geçmiş veri yok.")

    reg = RandomForestRegressor(n_estimators=150, max_depth=6, min_samples_leaf=10, max_features="sqrt", n_jobs=-1, random_state=42)
    clf = RandomForestClassifier(n_estimators=150, max_depth=6, min_samples_leaf=10, max_features="sqrt", n_jobs=-1, random_state=42)

    reg.fit(tr[FEATURE_COLUMNS], tr[TARGET_COLUMN])
    clf.fit(tr[FEATURE_COLUMNS], tr[TARGET_UP])
    metrics = evaluate(reg, te, clf).to_dict()

    # En güncel tahmin için tüm etiketli veriyle son fit
    labeled = feats.dropna(subset=[TARGET_COLUMN])
    reg_full = RandomForestRegressor(n_estimators=150, max_depth=6, min_samples_leaf=10, max_features="sqrt", n_jobs=-1, random_state=42)
    clf_full = RandomForestClassifier(n_estimators=150, max_depth=6, min_samples_leaf=10, max_features="sqrt", n_jobs=-1, random_state=42)
    reg_full.fit(labeled[FEATURE_COLUMNS], labeled[TARGET_COLUMN])
    clf_full.fit(labeled[FEATURE_COLUMNS], labeled[TARGET_UP])

    bundle = {
        "ticker": ticker,
        "regressor": reg_full,
        "classifier": clf_full,
        "metrics": metrics,
        "train_size": len(tr),
        "test_size": len(te),
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }
    joblib.dump(bundle, model_file, compress=2)
    with _dedicated_lock:
        _dedicated_cache[clean_sym] = bundle
    return bundle


def predict(ticker: str, bundle: dict[str, Any] | None = None) -> dict[str, Any]:
    """Hissenin en güncel verisiyle hem hisseye özel hem piyasa geneli modelinden tahmin üretir."""
    global_bundle = bundle or load_model()
    ticker = normalize_ticker(ticker)

    df = get_processed_data(ticker)
    market = _safe_market()
    feats = build_features(df, market)
    if feats.empty:
        raise DataFetchError(f"'{ticker}' için tahmin üretecek yeterli veri yok.")

    latest = feats.iloc[[-1]]
    x = latest[FEATURE_COLUMNS]
    x_np = x.to_numpy()
    last_close = float(latest["Close"].iloc[0])

    # 1) Hisseye Özel Model (Dedicated Model)
    try:
        ded_bundle = get_or_train_dedicated_model(ticker)
        ded_reg: RandomForestRegressor = ded_bundle["regressor"]
        ded_clf: RandomForestClassifier = ded_bundle["classifier"]

        ded_return = float(ded_reg.predict(x)[0])
        ded_prob_up = float(ded_clf.predict_proba(x)[0][list(ded_clf.classes_).index(1.0)])
        ded_accuracy = ded_bundle["metrics"]["directional_accuracy"]
        ded_price = round(last_close * (1 + ded_return), 2)
        ded_train_size = ded_bundle["train_size"]
    except Exception as exc:
        logger.warning("%s hisseye özel model hatası, piyasa modeli kullanılacak: %s", ticker, exc)
        ded_return = None
        ded_prob_up = None
        ded_accuracy = None
        ded_price = None
        ded_train_size = None

    # 2) Piyasa Geneli Model (Global BIST Benchmark)
    glob_reg: RandomForestRegressor = global_bundle["regressor"]
    glob_clf: RandomForestClassifier = global_bundle["classifier"]

    glob_return = float(glob_reg.predict(x)[0])
    glob_prob_up = float(glob_clf.predict_proba(x)[0][list(glob_clf.classes_).index(1.0)])
    glob_price = round(last_close * (1 + glob_return), 2)

    # Karar ağaçlarının aralığı (Confidence interval %10-%90)
    tree_preds = np.array([est.predict(x_np)[0] for est in glob_reg.estimators_])
    low_ret, high_ret = np.percentile(tree_preds, [10, 90])

    # 3) Hibrit Konsensüs Hesaplama (65% hisseye özel + 35% piyasa geneli)
    if ded_return is not None and ded_prob_up is not None:
        final_return = 0.65 * ded_return + 0.35 * glob_return
        final_prob = 0.65 * ded_prob_up + 0.35 * glob_prob_up
        predicted_price = round(last_close * (1 + final_return), 2)
    else:
        final_return = glob_return
        final_prob = glob_prob_up
        predicted_price = glob_price

    if final_prob >= 0.58:
        trend = "BULLISH"
        consensus_text = "GÜÇLÜ YÜKSELİŞ"
    elif final_prob >= BULLISH_THRESHOLD:
        trend = "BULLISH"
        consensus_text = "YÜKSELİŞ"
    elif final_prob <= 0.42:
        trend = "BEARISH"
        consensus_text = "GÜÇLÜ DÜŞÜŞ"
    elif final_prob <= BEARISH_THRESHOLD:
        trend = "BEARISH"
        consensus_text = "DÜŞÜŞ"
    else:
        trend = "NEUTRAL"
        consensus_text = "NÖTR / YATAY"

    return {
        "ticker": ticker,
        "last_close": round(last_close, 2),
        "last_date": latest.index[0].strftime("%Y-%m-%d"),
        "predicted_price": predicted_price,
        "predicted_change_pct": round(final_return * 100, 3),
        "price_range_low": round(last_close * (1 + float(low_ret)), 2),
        "price_range_high": round(last_close * (1 + float(high_ret)), 2),
        "probability_up": round(final_prob, 4),
        "trend": trend,
        "consensus_label": consensus_text,
        "confidence": round(abs(final_prob - 0.5) * 2, 4),
        "dedicated_model": {
            "enabled": ded_return is not None,
            "predicted_price": ded_price,
            "probability_up": round(ded_prob_up, 4) if ded_prob_up is not None else None,
            "directional_accuracy": round(ded_accuracy, 4) if ded_accuracy is not None else None,
            "train_days": ded_train_size,
        },
        "global_model": {
            "predicted_price": glob_price,
            "probability_up": round(glob_prob_up, 4),
            "benchmark_accuracy": round(global_bundle["metrics"]["directional_accuracy"], 4),
        },
        "signals": technical_signals(df),
        "model_trained_at": global_bundle.get("trained_at"),
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
        print(f"Hisseler  : {len(bundle['tickers'])} adet")
        print(f"Train/Test: {bundle['train_size']}/{bundle['test_size']}  (test donemi {bundle['test_period']})")
        for k, v in bundle["metrics"].items():
            print(f"  {k:24s}: {v}")
        print("En onemli 5 ozellik:", [f["feature"] for f in bundle["feature_importances"][:5]])

    if args.predict:
        res = predict(args.predict)
        res.pop("signals")
        print("\nTahmin:", res)

    if not args.train and not args.predict:
        parser.print_help()


if __name__ == "__main__":
    _main()
