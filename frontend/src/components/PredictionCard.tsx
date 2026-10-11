"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ShieldAlert,
  Brain,
  Gauge,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { PredictionResponse } from "@/types/stock";

interface PredictionCardProps {
  prediction: PredictionResponse | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onOpenGlossary?: () => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  isLoading,
  error,
  onRetry,
  onOpenGlossary,
}) => {
  if (isLoading) {
    return (
      <div className="card-panel rounded-2xl p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2" />
        <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="card-panel rounded-2xl p-6 space-y-3 text-center">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
          Tahmin Alınamadı
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {error || "Model bu hisse için henüz tahmin üretemedi."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            Yeniden Dene
          </button>
        )}
      </div>
    );
  }

  const isBullish = prediction.trend === "BULLISH";
  const isBearish = prediction.trend === "BEARISH";

  const themeConfig = isBullish
    ? {
        border: "border-emerald-500/30",
        badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        glow: "shadow-emerald-500/10",
        icon: TrendingUp,
        label: "YÜKSELİŞ TAHMİNİ",
        color: "text-emerald-500",
      }
    : isBearish
    ? {
        border: "border-rose-500/30",
        badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        glow: "shadow-rose-500/10",
        icon: TrendingDown,
        label: "DÜŞÜŞ TAHMİNİ",
        color: "text-rose-500",
      }
    : {
        border: "border-amber-500/30",
        badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        glow: "shadow-amber-500/10",
        icon: Minus,
        label: "YATAY / NÖTR TAHMİN",
        color: "text-amber-500",
      };

  const IconComponent = themeConfig.icon;
  const probPct = Math.round(prediction.probability_up * 100);

  return (
    <div
      className={`card-panel rounded-2xl p-5 sm:p-6 space-y-5 border ${themeConfig.border} shadow-lg ${themeConfig.glow} transition`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Yapay Zeka Analiz Kartı
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h2>
            <p className="text-[11px] text-slate-400">Random Forest Regresyon & Sınıflandırma</p>
          </div>
        </div>

        {/* Trend Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${themeConfig.badgeBg}`}
        >
          <IconComponent className="w-4 h-4" />
          <span>{themeConfig.label}</span>
        </div>
      </div>

      {/* Primary Target Price Highlight */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Hedef Kapanış Fiyatı (Sonraki Gün)
          </span>
          {onOpenGlossary && (
            <button
              onClick={onOpenGlossary}
              className="text-slate-400 hover:text-blue-500 transition"
              title="Terim ve formül açıklamaları"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
              ₺{prediction.predicted_price.toFixed(2)}
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                prediction.predicted_change_pct >= 0
                  ? "text-emerald-500"
                  : "text-rose-500"
              }`}
            >
              {prediction.predicted_change_pct >= 0 ? "+" : ""}
              %{prediction.predicted_change_pct.toFixed(2)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block" title="Karar ağaçlarının %10 ile %90 persentil güven aralığı">
              %10-%90 Güven Aralığı
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
              ₺{prediction.price_range_low.toFixed(2)} - ₺{prediction.price_range_high.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Upward Probability Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5" title="Model ağaçlarının yükseliş yönlü oy oranı (≥%55: Yükseliş, ≤%45: Düşüş)">
            <Gauge className="w-3.5 h-3.5 text-indigo-500" />
            Yükseliş Olasılığı (Directional Probability)
          </span>
          <span className="font-bold font-mono text-slate-900 dark:text-white">
            %{probPct}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              probPct >= 55
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : probPct <= 45
                ? "bg-gradient-to-r from-rose-500 to-amber-500"
                : "bg-gradient-to-r from-amber-500 to-indigo-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, probPct))}%` }}
          />
        </div>
      </div>

      {/* Technical Signals Breakdown with Tooltips */}
      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Teknik İndikatör Sinyalleri (5 Sinyal)
          </span>
          {onOpenGlossary && (
            <button
              onClick={onOpenGlossary}
              className="text-[11px] text-blue-500 hover:underline"
            >
              Nasıl Yorumlanır?
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {prediction.signals?.map((sig, idx) => {
            const sigColor =
              sig.signal === "BULLISH"
                ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                : sig.signal === "BEARISH"
                ? "text-rose-500 bg-rose-500/10 border-rose-500/20"
                : "text-amber-500 bg-amber-500/10 border-amber-500/20";

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="font-bold text-slate-900 dark:text-white shrink-0">
                    {sig.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {sig.description}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase shrink-0 border ${sigColor}`}
                >
                  {sig.signal === "BULLISH"
                    ? "AL"
                    : sig.signal === "BEARISH"
                    ? "SAT"
                    : "NÖTR"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
        <span>
          <strong>Yasal Uyarı (YTD):</strong> Bu veriler Scikit-Learn Random Forest modeli tarafından matematiksel olarak üretilmiştir. Kesinlikle yatırım tavsiyesi niteliği taşımaz.
        </span>
      </div>
    </div>
  );
};
