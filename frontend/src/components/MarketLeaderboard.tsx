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

export const MarketLeaderboard: React.FC<MarketLeaderboardProps> = ({
  onSelectStock,
}) => {
  const [timeframe, setTimeframe] = useState<"1w" | "1mo" | "1y">("1w");
  const [filterType, setFilterType] = useState<"gainers" | "losers" | "all">(
    "gainers"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<MarketPerformanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("change_pct");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Pagination / Page limit
  const [displayLimit, setDisplayLimit] = useState<number>(30);

  // Load performance data
  const loadPerformance = async (tf: "1w" | "1mo" | "1y") => {
    setIsLoading(true);
    try {
      const res = await getMarketPerformance(tf);
      setData(res);
    } catch (err) {
      console.error("Performance load error:", err);
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

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "code" ? "asc" : "desc");
    }
  };

  // Determine base list
  const baseList: PerformanceStockItem[] = useMemo(() => {
    if (!data) return [];
    if (filterType === "gainers") return data.gainers;
    if (filterType === "losers") return data.losers;
    return data.all_stocks;
  }, [data, filterType]);

  // Filtered & Sorted list
  const processedList = useMemo(() => {
    let list = [...baseList];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.ticker.toLowerCase().includes(q)
      );
    }

    // Sort
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

  const topGainer = data?.gainers[0];
  const topLoser = data?.losers[0];

  return (
    <div className="card-panel rounded-2xl p-6 sm:p-7 space-y-6">
      {/* Top Section: Title & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" />
              Dönemsel Performans Tablosu
            </span>
            <InfoTooltip
              title="Dönemsel Getiri Sıralaması"
              description="BIST hisselerinin seçilen zaman dilimi (Haftalık: 5 iş günü, Aylık: 21 iş günü, Yıllık: 252 iş günü) boyunca kaydettiği net getiri yüzdeleridir."
              interpretation="Sadece ilk 5 hisse ile sınırlı değildir; belirlenen dönemde artıda olan tüm hisseler veya ekside olan tüm hisseler eksiksiz listelenir."
              placement="bottom"
              align="left"
            />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Haftalık, Aylık ve Yıllık En Çok Yükselen / Düşen Hisseler
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Artıda olan veya ekside olan tüm hisseleri inceleyebilir, sütun başlıklarına tıklayarak sıralayabilirsiniz.
          </p>
        </div>

        {/* Timeframe Buttons: 1W, 1M, 1Y */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 self-start lg:self-auto shrink-0">
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

      {/* Summary Highlight Metrics */}
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
              <span className="font-mono font-bold text-xs">
                +{topGainer?.change_pct.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-500 transition">
                {topGainer?.code || "-"}
              </div>
              <div className="text-xs text-slate-400 truncate max-w-[140px]">
                {topGainer?.name}
              </div>
            </div>
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
              <span className="font-mono font-bold text-xs">
                {topLoser?.change_pct.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-rose-500 transition">
                {topLoser?.code || "-"}
              </div>
              <div className="text-xs text-slate-400 truncate max-w-[140px]">
                {topLoser?.name}
              </div>
            </div>
          </div>

          {/* Market Balance Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Piyasa Getiri Dengesi
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {data.total_analyzed} Hisse
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold font-mono">
              <span className="text-emerald-500">
                ▲ {data.total_gainers} Artıda
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-rose-500">
                ▼ {data.total_losers} Ekside
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & In-table Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Pills: Tüm Yükselenler / Tüm Düşenler / Tümü */}
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
            {data && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-[10px]">
                {data.total_gainers}
              </span>
            )}
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
            {data && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-rose-500/20 text-[10px]">
                {data.total_losers}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              filterType === "all"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 shadow-sm"
                : "border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span>Tüm Liste</span>
            {data && (
              <span className="ml-1 text-[10px] text-slate-400">
                ({data.total_analyzed})
              </span>
            )}
          </button>
        </div>

        {/* Search input in table */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tabloda hisse kodu veya adı ara..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-3">
          <RotateCw className="w-6 h-6 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-400">
            {timeframe === "1w" ? "Haftalık" : timeframe === "1mo" ? "Aylık" : "Yıllık"} getiri sıralaması taranıyor...
          </p>
        </div>
      ) : processedList.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          Bu kriterlere uygun hisse bulunamadı.
        </div>
      ) : (
        <div className="space-y-4">
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
                      <span>Hisse</span>
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
                {processedList.slice(0, displayLimit).map((item, idx) => {
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
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-500 transition">
                            {item.code}
                          </span>
                          <span className="text-xs text-slate-400 truncate max-w-[120px] sm:max-w-[180px]">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        ₺{formatTRY(item.last_close)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                        ₺{formatTRY(item.start_close)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs ${changeBg}`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isPositive ? "+" : ""}
                            %{item.change_pct.toFixed(2)}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={
                            item.rsi >= 70
                              ? "text-rose-500 font-bold"
                              : item.rsi <= 30
                              ? "text-emerald-500 font-bold"
                              : "text-slate-600 dark:text-slate-300"
                          }
                        >
                          {item.rsi}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                        {formatVol(item.volume)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStock(item.ticker);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
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
          </div>

          {/* Show More / Show All Pagination Bar */}
          {processedList.length > displayLimit && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setDisplayLimit((prev) => prev + 50)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
              >
                Daha Fazla Göster ({processedList.length - displayLimit} Hisse Daha)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
