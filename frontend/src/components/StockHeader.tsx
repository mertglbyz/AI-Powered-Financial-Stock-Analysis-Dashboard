"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { HistoricalSummary } from "@/types/stock";

interface StockHeaderProps {
  ticker: string;
  companyName: string | null;
  summary: HistoricalSummary;
  lastDate?: string;
}

export const StockHeader: React.FC<StockHeaderProps> = ({
  ticker,
  companyName,
  summary,
  lastDate,
}) => {
  const isPositive = summary.change >= 0;
  const isPeriodPositive = summary.period_return_pct >= 0;

  // Format currency
  const formatTRY = (val: number) =>
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);

  // Format volume
  const formatVol = (val: number) => {
    if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(2) + " Mlyr";
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + " M";
    if (val >= 1_000) return (val / 1_000).toFixed(1) + " K";
    return val.toString();
  };

  return (
    <div className="card-panel rounded-2xl p-5 sm:p-6 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Ticker & Price */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {ticker.replace(".IS", "")}
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {ticker}
            </span>
            {lastDate && (
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Son İşlem: {lastDate}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {companyName || "Borsa İstanbul Şirketi"}
          </p>

          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-slate-900 dark:text-white">
              ₺{formatTRY(summary.last_close)}
            </span>
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-sm font-bold ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {formatTRY(summary.change)} TL (%{summary.change_pct.toFixed(2)})
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
          {/* 52W Range */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              52H En Yüksek
            </span>
            <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 block">
              ₺{formatTRY(summary.high_52w)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              52H En Düşük
            </span>
            <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 block">
              ₺{formatTRY(summary.low_52w)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Son Hacim
            </span>
            <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 block">
              {formatVol(summary.volume)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Dönem Getirisi
            </span>
            <span
              className={`text-sm font-bold font-mono mt-1 block ${
                isPeriodPositive
                  ? "text-emerald-500"
                  : "text-rose-500"
              }`}
            >
              %{summary.period_return_pct.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
