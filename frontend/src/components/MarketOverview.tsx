"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronRight,
  Brain,
  Layers,
  Gauge,
  BarChart2,
} from "lucide-react";
import { MarketOverviewResponse, MarketStockSnapshot } from "@/types/stock";
import { InfoTooltip } from "./InfoTooltip";

interface MarketOverviewProps {
  overview: MarketOverviewResponse | null;
  isLoading: boolean;
  onSelectStock: (ticker: string) => void;
  onOpenModelInfo: () => void;
  onOpenGlossary: () => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  overview,
  isLoading,
  onSelectStock,
  onOpenModelInfo,
  onOpenGlossary,
}) => {
  if (isLoading || !overview) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 card-panel rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 card-panel rounded-2xl" />
          <div className="h-32 card-panel rounded-2xl" />
          <div className="h-32 card-panel rounded-2xl" />
          <div className="h-32 card-panel rounded-2xl" />
        </div>
        <div className="h-96 card-panel rounded-2xl" />
      </div>
    );
  }

  const { bist100, sentiment_barometer, popular_stocks, top_gainers, top_losers } = overview;
  const isBistPositive = bist100.change >= 0;

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

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Market Header */}
      <div className="card-panel rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-transparent border border-blue-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 animate-pulse text-blue-500" />
                Canlı Borsa İstanbul Paneli
              </span>
              <span className="text-xs text-slate-400">
                420+ Hisse • BIST 100 Endeks Özeti
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Borsa İstanbul & Yapay Zeka Barometresi
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              BIST hisselerinin canlı teknik indikatörleri, makine öğrenmesi trend olasılıkları ve hisseye özel derinlemesine analiz platformu.
            </p>
          </div>

          {/* BIST 100 Highlight Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                <span>BIST 100 ENDEKSİ</span>
                <InfoTooltip
                  title="BIST 100 (XU100)"
                  description="Borsa İstanbul Pay Piyasası için temel gösterge endeksidir. En yüksek piyasa değerine ve işlem hacmine sahip 100 şirketten oluşur."
                />
              </div>
              <span className="font-mono text-[11px]">{bist100.last_date}</span>
            </div>

            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {formatTRY(bist100.last_close)}
              </span>
              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                  isBistPositive
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                }`}
              >
                {isBistPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>
                  {isBistPositive ? "+" : ""}
                  %{bist100.change_pct.toFixed(2)}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Değişim: {isBistPositive ? "+" : ""}{formatTRY(bist100.change)} puan
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sentiment Barometer */}
        <div className="card-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-indigo-500" />
              Yapay Zeka Piyasa Hissi
            </span>
            <InfoTooltip
              title="Yapay Zeka Piyasa Hissi (Sentiment Barometer)"
              description="Önde gelen BIST hisselerinde karar ağaçlarının yükseliş (Boğa) ve düşüş (Ayı) sinyali üretme oranını gösterir."
            />
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {sentiment_barometer.market_sentiment}
            </span>
            <span className="text-xs font-bold font-mono text-emerald-500">
              %{sentiment_barometer.bullish_pct} Boğa
            </span>
          </div>

          {/* Multi-color bar */}
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${sentiment_barometer.bullish_pct}%` }}
              title={`Yükseliş: %${sentiment_barometer.bullish_pct}`}
            />
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${sentiment_barometer.neutral_pct}%` }}
              title={`Nötr: %${sentiment_barometer.neutral_pct}`}
            />
            <div
              className="h-full bg-rose-500 transition-all"
              style={{ width: `${sentiment_barometer.bearish_pct}%` }}
              title={`Düşüş: %${sentiment_barometer.bearish_pct}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Yükseliş: %{sentiment_barometer.bullish_pct}</span>
            <span>Nötr: %{sentiment_barometer.neutral_pct}</span>
            <span>Düşüş: %{sentiment_barometer.bearish_pct}</span>
          </div>
        </div>

        {/* Top Gainer */}
        <div className="card-panel rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Öne Çıkan Yükselen
          </span>
          {top_gainers[0] ? (
            <button
              onClick={() => onSelectStock(top_gainers[0].ticker)}
              className="w-full text-left group space-y-1 block"
            >
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition">
                  {top_gainers[0].code}
                </span>
                <span className="font-mono text-sm font-bold text-emerald-500">
                  +%{top_gainers[0].change_pct.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{top_gainers[0].name}</p>
              <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 block">
                ₺{formatTRY(top_gainers[0].last_close)}
              </span>
            </button>
          ) : (
            <p className="text-xs text-slate-400">Veri yok</p>
          )}
        </div>

        {/* Top Loser */}
        <div className="card-panel rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            Öne Çıkan Düşen
          </span>
          {top_losers[0] ? (
            <button
              onClick={() => onSelectStock(top_losers[0].ticker)}
              className="w-full text-left group space-y-1 block"
            >
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition">
                  {top_losers[0].code}
                </span>
                <span className="font-mono text-sm font-bold text-rose-500">
                  %{top_losers[0].change_pct.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{top_losers[0].name}</p>
              <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 block">
                ₺{formatTRY(top_losers[0].last_close)}
              </span>
            </button>
          ) : (
            <p className="text-xs text-slate-400">Veri yok</p>
          )}
        </div>

        {/* Model Architecture Fast Link */}
        <div className="card-panel rounded-2xl p-5 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-indigo-500" />
                ML Mimarisi
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-mono">
                v2 Pro
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium">
              Hisseye Özel + Piyasa Geneli İki Katmanlı Model
            </p>
          </div>
          <button
            onClick={onOpenModelInfo}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1"
          >
            <span>Model Detaylarını İncele</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Stock Screener Table */}
      <div className="card-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              BIST Öne Çıkan Hisseler & Yapay Zeka Sinyalleri
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              İncelemek istediğiniz hissenin üzerine tıklayarak derinlemesine analiz sayfasına geçebilirsiniz.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono self-start sm:self-auto">
            {popular_stocks.length} Hisse Taranıyor
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Hisse</th>
                <th className="py-3 px-3">Son Fiyat</th>
                <th className="py-3 px-3">Günlük Değişim</th>
                <th className="py-3 px-3">
                  <div className="flex items-center gap-1">
                    <span>RSI (14)</span>
                    <InfoTooltip
                      title="RSI (14)"
                      description="14 günlük Göreceli Güç Endeksi. 70 üzeri aşırı alım, 30 altı aşırı satım bölgesidir."
                    />
                  </div>
                </th>
                <th className="py-3 px-3">Hacim</th>
                <th className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span>AI Model Sinyali</span>
                    <InfoTooltip
                      title="Yapay Zeka Sinyali"
                      description="Random Forest modelinin hisse trendi ve teknik göstergeler üzerinden ürettiği anlık sinyal."
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {popular_stocks.map((stock) => {
                const isPositive = stock.change >= 0;
                const trendBadge =
                  stock.trend === "BULLISH"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : stock.trend === "BEARISH"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

                const rsiColor =
                  stock.rsi >= 70
                    ? "text-rose-500 font-bold"
                    : stock.rsi <= 30
                    ? "text-emerald-500 font-bold"
                    : "text-slate-600 dark:text-slate-300";

                return (
                  <tr
                    key={stock.ticker}
                    onClick={() => onSelectStock(stock.ticker)}
                    className="hover:bg-blue-50/60 dark:hover:bg-slate-800/60 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-500 transition">
                          {stock.code}
                        </span>
                        <span className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                          {stock.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      ₺{formatTRY(stock.last_close)}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-semibold">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isPositive ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        %{stock.change_pct.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono">
                      <span className={rsiColor}>{stock.rsi}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {formatVol(stock.volume)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase border ${trendBadge}`}
                      >
                        {stock.trend === "BULLISH" ? (
                          <>
                            <TrendingUp className="w-3 h-3" />
                            AL
                          </>
                        ) : stock.trend === "BEARISH" ? (
                          <>
                            <TrendingDown className="w-3 h-3" />
                            SAT
                          </>
                        ) : (
                          "NÖTR"
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
