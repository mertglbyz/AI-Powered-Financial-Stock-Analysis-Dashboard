"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  RotateCw,
  Sparkles,
  ArrowUpDown,
  ChevronDown,
  Layers,
  Award,
  Columns,
  Table as TableIcon,
  Filter,
} from "lucide-react";
import {
  MarketPerformanceResponse,
  PerformanceStockItem,
} from "@/types/stock";
import { getMarketPerformance } from "@/lib/api";
import { InfoTooltip } from "./InfoTooltip";

interface MarketLeaderboardProps {
  onSelectStock: (ticker: string) => void;
}

type SortField = "change_pct" | "last_close" | "start_close" | "volume" | "rsi" | "code";
type SortOrder = "asc" | "desc";
type ViewMode = "dual" | "table";

export const MarketLeaderboard: React.FC<MarketLeaderboardProps> = ({
  onSelectStock,
}) => {
  const [timeframe, setTimeframe] = useState<"1w" | "1mo" | "1y">("1w");
  const [viewMode, setViewMode] = useState<ViewMode>("dual");
  const [filterType, setFilterType] = useState<"gainers" | "losers" | "all">(
    "gainers"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<MarketPerformanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting state for table mode
  const [sortField, setSortField] = useState<SortField>("change_pct");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Limits
  const [dualGainersLimit, setDualGainersLimit] = useState<number>(15);
  const [dualLosersLimit, setDualLosersLimit] = useState<number>(15);
  const [tableDisplayLimit, setTableDisplayLimit] = useState<number>(30);

  // Load performance data
  const loadPerformance = async (tf: "1w" | "1mo" | "1y") => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getMarketPerformance(tf);
      setData(res);
    } catch (err: any) {
      console.error("Performance load error:", err);
      setError(err?.message || "Dönemsel performans verileri alınamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance(timeframe);
  }, [timeframe]);

  const formatTRY = (val: number) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  const formatVol = (val: number) => {
    if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + " Mlyr";
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + " M";
    if (val >= 1_000) return (val / 1_000).toFixed(0) + " K";
    return val.toString();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "code" ? "asc" : "desc");
    }
  };

  // Base list for table mode
  const baseList: PerformanceStockItem[] = useMemo(() => {
    if (!data) return [];
    if (filterType === "gainers") return data.gainers;
    if (filterType === "losers") return data.losers;
    return data.all_stocks;
  }, [data, filterType]);

  // Filtered & Sorted list for table mode
  const processedTableList = useMemo(() => {
    let list = [...baseList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.ticker.toLowerCase().includes(q) ||
          (item.sector && item.sector.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }
      return sortOrder === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return list;
  }, [baseList, searchQuery, sortField, sortOrder]);

  // Filtered gainers and losers for dual mode
  const filteredGainers = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data.gainers;
    const q = searchQuery.toLowerCase();
    return data.gainers.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.sector && item.sector.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const filteredLosers = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data.losers;
    const q = searchQuery.toLowerCase();
    return data.losers.filter(
      (item) =>
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.sector && item.sector.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const topGainer = data?.gainers[0];
  const topLoser = data?.losers[0];

  const bullishRatio =
    data && data.total_analyzed > 0
      ? Math.round((data.total_gainers / data.total_analyzed) * 100)
      : 50;

  return (
    <div className="card-panel rounded-2xl p-6 sm:p-7 space-y-6">
      {/* Top Section: Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" />
              BIST Piyasa Liderlik Tablosu
            </span>
            <InfoTooltip
              title="Dönemsel Getiri Sıralaması (Tüm BIST Evreni)"
              description="Borsa İstanbul'daki tüm şirketlerin seçilen zaman dilimi (Haftalık: 5 iş günü, Aylık: 21 iş günü, Yıllık: 252 iş günü) boyunca kaydettiği net getiri yüzdeleridir."
              interpretation="Sadece ilk 3-5 hisse ile sınırlı değildir; belirlenen dönemde artıda olan TÜM hisseler ile ekside olan TÜM hisseler eksiksiz taranır ve listelenir."
              placement="bottom"
              align="left"
            />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Haftalık, Aylık ve Yıllık En Çok Yükselen / Düşen Hisseler
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Artıda olan tüm şirketleri ve ekside olan tüm şirketleri inceleyebilir, derinlemesine analiz için hisseye tıklayabilirsiniz.
          </p>
        </div>

        {/* View Mode & Timeframe Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
          {/* Dual vs Table Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode("dual")}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
                viewMode === "dual"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Yan Yana Liderler Görünümü"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yan Yana</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Detaylı Tablo Görünümü"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablo</span>
            </button>
          </div>

          {/* Timeframe Buttons: 1W, 1M, 1Y */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                setTimeframe("1w");
                setSortField("change_pct");
                setSortOrder("desc");
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                timeframe === "1w"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Haftalık (1H)
            </button>
            <button
              onClick={() => {
                setTimeframe("1mo");
                setSortField("change_pct");
                setSortOrder("desc");
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                timeframe === "1mo"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Aylık (1A)
            </button>
            <button
              onClick={() => {
                setTimeframe("1y");
                setSortField("change_pct");
                setSortOrder("desc");
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                timeframe === "1y"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Yıllık (1Y)
            </button>
          </div>
        </div>
      </div>

      {/* Summary Highlight Metrics Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Top Gainer Card */}
          <div
            onClick={() => topGainer && onSelectStock(topGainer.ticker)}
            className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition group"
          >
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Dönemin Lideri (En Çok Artan)
              </span>
              <span className="font-mono font-bold text-xs bg-emerald-500/20 px-1.5 py-0.5 rounded">
                +{topGainer?.change_pct.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-500 transition">
                  {topGainer?.code || "-"}
                </span>
                {topGainer?.sector && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {topGainer.sector}
                  </span>
                )}
              </div>
              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                ₺{topGainer ? formatTRY(topGainer.last_close) : "-"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{topGainer?.name}</p>
          </div>

          {/* Top Loser Card */}
          <div
            onClick={() => topLoser && onSelectStock(topLoser.ticker)}
            className="p-3.5 rounded-xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 cursor-pointer hover:border-rose-500/40 transition group"
          >
            <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 mb-1">
              <span className="font-semibold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                Dönemin En Çok Düşeni
              </span>
              <span className="font-mono font-bold text-xs bg-rose-500/20 px-1.5 py-0.5 rounded">
                {topLoser?.change_pct.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-rose-500 transition">
                  {topLoser?.code || "-"}
                </span>
                {topLoser?.sector && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {topLoser.sector}
                  </span>
                )}
              </div>
              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                ₺{topLoser ? formatTRY(topLoser.last_close) : "-"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{topLoser?.name}</p>
          </div>

          {/* Market Balance Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Piyasa Getiri Dengesi
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {data.total_analyzed} BIST Hissesi
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold font-mono">
              <span className="text-emerald-500">
                ▲ {data.total_gainers} Artıda (%{bullishRatio})
              </span>
              <span className="text-rose-500">
                ▼ {data.total_losers} Ekside (%{100 - bullishRatio})
              </span>
            </div>
            {/* Visual Balance Bar */}
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex mt-2">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${bullishRatio}%` }}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${100 - bullishRatio}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Global In-Section Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hisse kodu, şirket adı veya sektör ara..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* View Mode Note */}
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span>
            {timeframe === "1w"
              ? "Son 1 haftalık (5 iş günü) performans"
              : timeframe === "1mo"
              ? "Son 1 aylık (21 iş günü) performans"
              : "Son 1 yıllık (252 iş günü) performans"}
          </span>
          <span className="font-mono text-blue-500 font-semibold">
            • {data?.total_analyzed || 0} Hisse Taranıyor
          </span>
        </div>
      </div>

      {/* Main Content: Dual View or Table View */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <RotateCw className="w-7 h-7 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-400">
            {timeframe === "1w"
              ? "Haftalık"
              : timeframe === "1mo"
              ? "Aylık"
              : "Yıllık"}{" "}
            tüm BIST getiri sıralaması taranıyor ve güncelleniyor...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-2 border border-rose-500/20 bg-rose-500/5 rounded-xl">
          <p className="text-xs text-rose-500 font-semibold">{error}</p>
          <button
            onClick={() => loadPerformance(timeframe)}
            className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 transition"
          >
            Yeniden Dene
          </button>
        </div>
      ) : !data ? null : viewMode === "dual" ? (
        /* DUAL COLUMN VIEW: GAINERS VS LOSERS SIDE BY SIDE */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LEFT: GAINERS COLUMN */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] dark:bg-emerald-950/10 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    En Çok Yükselenler
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                      {filteredGainers.length} Hisse
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Seçilen dönemde pozitif getiri sağlayan tüm hisseler
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                Getiri %
              </span>
            </div>

            {filteredGainers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Arama kriterlerine uygun yükselen hisse bulunamadı.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGainers.slice(0, dualGainersLimit).map((item, idx) => {
                  const isTop3 = idx < 3;
                  return (
                    <div
                      key={item.ticker}
                      onClick={() => onSelectStock(item.ticker)}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/50 hover:shadow-sm cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                            idx === 0
                              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : idx === 1
                              ? "bg-slate-300/40 text-slate-700 dark:text-slate-300 border border-slate-400/30"
                              : idx === 2
                              ? "bg-amber-700/20 text-amber-700 dark:text-amber-500 border border-amber-700/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          }`}
                        >
                          {idx + 1}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition">
                              {item.code}
                            </span>
                            {item.sector && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300 truncate max-w-[110px]">
                                {item.sector}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {item.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            ₺{formatTRY(item.last_close)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            RSI: {item.rsi}
                          </div>
                        </div>

                        <div className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>+%{item.change_pct.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredGainers.length > dualGainersLimit && (
                  <button
                    onClick={() => setDualGainersLimit((prev) => prev + 25)}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition flex items-center justify-center gap-1"
                  >
                    <span>
                      Daha Fazla Yükselen Göster ({filteredGainers.length - dualGainersLimit} Hisse Daha)
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: LOSERS COLUMN */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.02] dark:bg-rose-950/10 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    En Çok Düşenler
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold">
                      {filteredLosers.length} Hisse
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Seçilen dönemde negatif getiri kaydeden tüm hisseler
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                Kayıp %
              </span>
            </div>

            {filteredLosers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Arama kriterlerine uygun düşen hisse bulunamadı.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLosers.slice(0, dualLosersLimit).map((item, idx) => {
                  return (
                    <div
                      key={item.ticker}
                      onClick={() => onSelectStock(item.ticker)}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-500/50 hover:shadow-sm cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[11px] font-mono font-bold shrink-0">
                          {idx + 1}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-500 transition">
                              {item.code}
                            </span>
                            {item.sector && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300 truncate max-w-[110px]">
                                {item.sector}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {item.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            ₺{formatTRY(item.last_close)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            RSI: {item.rsi}
                          </div>
                        </div>

                        <div className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs flex items-center gap-0.5">
                          <ArrowDownRight className="w-3 h-3" />
                          <span>%{item.change_pct.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredLosers.length > dualLosersLimit && (
                  <button
                    onClick={() => setDualLosersLimit((prev) => prev + 25)}
                    className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition flex items-center justify-center gap-1"
                  >
                    <span>
                      Daha Fazla Düşen Göster ({filteredLosers.length - dualLosersLimit} Hisse Daha)
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="space-y-4">
          {/* Filter Tabs: Gainers / Losers / All */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setFilterType("gainers");
                setSortField("change_pct");
                setSortOrder("desc");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                filterType === "gainers"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tüm Yükselenler</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-[10px]">
                {data.total_gainers}
              </span>
            </button>

            <button
              onClick={() => {
                setFilterType("losers");
                setSortField("change_pct");
                setSortOrder("asc");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                filterType === "losers"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              <span>Tüm Düşenler</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-rose-500/20 text-[10px]">
                {data.total_losers}
              </span>
            </button>

            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                filterType === "all"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>Tüm BIST Evreni</span>
              <span className="ml-1 text-[10px] text-slate-400">
                ({data.total_analyzed})
              </span>
            </button>
          </div>

          {processedTableList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Bu kriterlere uygun hisse bulunamadı.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                    <th className="py-3 px-3">#</th>
                    <th
                      onClick={() => handleSort("code")}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>Hisse & Sektör</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("last_close")}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>Son Fiyat</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Dönem Başı Fiyat</th>
                    <th
                      onClick={() => handleSort("change_pct")}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>Dönemsel Değişim</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60 text-blue-500" />
                        <InfoTooltip
                          title="Dönemsel Değişim (%)"
                          description="Seçilen periyodun (Haftalık/Aylık/Yıllık) başındaki kapanış fiyatına göre bugünkü kapanışın yüzdesel kazancı veya kaybıdır."
                          formula="Değişim % = [(Son Fiyat - Dönem Başı Fiyat) / Dönem Başı Fiyat] × 100"
                          placement="bottom"
                          align="left"
                        />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("rsi")}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>RSI (14)</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("volume")}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white transition"
                    >
                      <div className="flex items-center gap-1">
                        <span>Hacim</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {processedTableList.slice(0, tableDisplayLimit).map((item, idx) => {
                    const isPositive = item.change_pct >= 0;
                    const changeBg = isPositive
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400";

                    return (
                      <tr
                        key={item.ticker}
                        onClick={() => onSelectStock(item.ticker)}
                        className="hover:bg-blue-50/60 dark:hover:bg-slate-800/60 cursor-pointer transition group"
                      >
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition">
                              {item.code}
                            </span>
                            {item.sector && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 truncate max-w-[120px]">
                                {item.sector}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {item.name}
                          </p>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          ₺{formatTRY(item.last_close)}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          ₺{formatTRY(item.start_close)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-mono font-bold text-xs border ${changeBg}`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {isPositive ? "+" : ""}
                            %{item.change_pct.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span
                            className={
                              item.rsi >= 70
                                ? "text-amber-500 font-bold"
                                : item.rsi <= 30
                                ? "text-emerald-500 font-bold"
                                : "text-slate-500"
                            }
                          >
                            {item.rsi}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {formatVol(item.volume)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStock(item.ticker);
                            }}
                            className="text-xs text-blue-500 hover:text-blue-600 font-semibold inline-flex items-center gap-1 group-hover:underline"
                          >
                            <span>Analiz Et</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {processedTableList.length > tableDisplayLimit && (
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={() => setTableDisplayLimit((prev) => prev + 30)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <span>
                      Daha Fazla Göster ({processedTableList.length - tableDisplayLimit} Hisse Daha)
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
