export type TrendType = "BULLISH" | "BEARISH" | "NEUTRAL";
export type PeriodType = "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y";

export interface TickerItem {
  symbol: string;
  code: string;
  name: string;
}

export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma_20: number;
  sma_50: number;
  rsi_14: number;
  macd: number;
  macd_signal: number;
  macd_hist: number;
  bb_upper: number;
  bb_lower: number;
  atr_14: number;
}

export interface HistoricalSummary {
  last_close: number;
  prev_close: number;
  change: number;
  change_pct: number;
  period_return_pct: number;
  high_52w: number;
  low_52w: number;
  volume: number;
  avg_volume_20: number;
}

export interface HistoricalResponse {
  ticker: string;
  name: string | null;
  period: PeriodType;
  count: number;
  summary: HistoricalSummary;
  data: StockDataPoint[];
}

export interface Signal {
  name: string;
  value: number;
  signal: TrendType;
  description: string;
}

export interface DedicatedModelDetail {
  enabled: boolean;
  predicted_price: number | null;
  probability_up: number | null;
  directional_accuracy: number | null;
  train_days: number | null;
}

export interface GlobalModelDetail {
  predicted_price: number;
  probability_up: number;
  benchmark_accuracy: number;
}

export interface PredictionResponse {
  ticker: string;
  name: string | null;
  last_close: number;
  last_date: string;
  predicted_price: number;
  predicted_change_pct: number;
  price_range_low: number;
  price_range_high: number;
  probability_up: number;
  trend: TrendType;
  consensus_label?: string | null;
  confidence: number;
  dedicated_model?: DedicatedModelDetail | null;
  global_model?: GlobalModelDetail | null;
  signals: Signal[];
  model_trained_at: string | null;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface ModelInfoResponse {
  version: number;
  trained_at: string;
  tickers: string[];
  train_size: number;
  test_size: number;
  test_period: {
    start: string;
    end: string;
  };
  metrics: {
    mae_return: number;
    rmse_return: number;
    mae_price: number;
    baseline_mae_price: number;
    directional_accuracy: number;
    baseline_accuracy: number;
    roc_auc: number;
    confident_accuracy: number;
    confident_coverage: number;
    long_signal_avg_return: number;
    all_days_avg_return: number;
  };
  feature_importances: FeatureImportance[];
}

export interface MarketStockSnapshot {
  ticker: string;
  code: string;
  name: string;
  last_close: number;
  change: number;
  change_pct: number;
  volume: number;
  trend: TrendType;
  rsi: number;
}

export interface MarketOverviewResponse {
  bist100: {
    last_close: number;
    change: number;
    change_pct: number;
    trend: TrendType;
    last_date: string;
  };
  sentiment_barometer: {
    bullish_pct: number;
    bearish_pct: number;
    neutral_pct: number;
    total_analyzed: number;
    market_sentiment: string;
  };
  popular_stocks: MarketStockSnapshot[];
  top_gainers: MarketStockSnapshot[];
  top_losers: MarketStockSnapshot[];
  updated_at: string;
}

export interface HealthResponse {
  status: string;
  model_ready: boolean;
  training: {
    status: string;
    started_at: string | null;
    finished_at: string | null;
    error: string | null;
  };
  ticker_count: number;
}
