import {
  HealthResponse,
  HistoricalResponse,
  MarketOverviewResponse,
  ModelInfoResponse,
  PeriodType,
  PredictionResponse,
  TickerItem,
} from "@/types/stock";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = `İstek başarısız (${res.status})`;
    try {
      const err = await res.json();
      errorDetail = err.detail || err.error || errorDetail;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function getHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>("/api/health");
}

export async function getMarketOverview(): Promise<MarketOverviewResponse> {
  return fetchJson<MarketOverviewResponse>("/api/market/overview");
}

export async function searchTickers(query: string = "", limit: number = 20): Promise<TickerItem[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("limit", limit.toString());
  return fetchJson<TickerItem[]>(`/api/tickers?${params.toString()}`);
}

export async function getHistorical(
  ticker: string,
  period: PeriodType = "1y"
): Promise<HistoricalResponse> {
  return fetchJson<HistoricalResponse>(
    `/api/historical/${encodeURIComponent(ticker)}?period=${period}`
  );
}

export async function getPrediction(ticker: string): Promise<PredictionResponse> {
  return fetchJson<PredictionResponse>(
    `/api/predict/${encodeURIComponent(ticker)}`
  );
}

export async function getModelInfo(): Promise<ModelInfoResponse> {
  return fetchJson<ModelInfoResponse>("/api/model/info");
}

export async function triggerRetrain(): Promise<{ status: string }> {
  return fetchJson<{ status: string }>("/api/model/train", {
    method: "POST",
  });
}
