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
  Layers,
  Cpu,
} from "lucide-react";
import { PredictionResponse } from "@/types/stock";
import { InfoTooltip } from "./InfoTooltip";

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

  // Helper for signal-specific tooltips
  const getSignalTooltipInfo = (sigName: string) => {
    switch (sigName) {
      case "RSI (14)":
        return {
          title: "RSI (14 Günlük Göreceli Güç Endeksi)",
          description: "Fiyatın son 14 gündeki yukarı ve aşağı hareketlerinin hızını ve momentumunu 0-100 arasında ölçer.",
          formula: "RSI = 100 - [100 / (1 + (Ortalama Kazanç / Ortalama Kayıp))]",
          interpretation: "RSI > 70 aşırı alım bölgesidir (düzeltme riski). RSI < 30 aşırı satım bölgesidir (tepki alımı beklentisi).",
        };
      case "MACD":
        return {
          title: "MACD (Hareketli Ortalama Yakınsama/Iraksama)",
          description: "12 günlük üssel hareketli ortalama (EMA) ile 26 günlük EMA arasındaki farktır. 9 günlük sinyal çizgisiyle kesişimleri takip edilir.",
          formula: "MACD = EMA(12) - EMA(26) | Sinyal = EMA_9(MACD)",
          interpretation: "MACD sinyal çizgisini yukarı kestiğinde AL, aşağı kestiğinde SAT sinyali üretir.",
        };
      case "Bollinger %B":
        return {
          title: "Bollinger Bantları (%B Konumu)",
          description: "20 günlük basit hareketli ortalama etrafındaki ±2 standart sapma bantlarına göre fiyatın konumunu normalize eder.",
          formula: "%B = (Fiyat - Alt Bant) / (Üst Bant - Alt Bant)",
          interpretation: "%B > 1.0 fiyat üst bandı delmiştir (aşırı alım). %B < 0.0 fiyat alt bandın altındadır (aşırı satım).",
        };
      case "SMA 20/50 Trend":
        return {
          title: "SMA 20 / SMA 50 Hareketli Ortalama Trendi",
          description: "Kısa vadeli 20 günlük ortalamanın orta vadeli 50 günlük ortalama ile ilişkisini gösterir.",
          formula: "SMA_20 = ∑Close_20 / 20,  SMA_50 = ∑Close_50 / 50",
          interpretation: "SMA 20 > SMA 50 ise yükseliş trendi (Bullish), aksi halde düşüş trendi (Bearish) hâkimdir.",
        };
      case "ATR Volatilite":
        return {
          title: "ATR (14 Günlük Ortalama Gerçek Aralık)",
          description: "Hissenin son 14 günlük ortalama günlük fiyat dalgalanma büyüklüğünü TL cinsinden ölçer.",
          formula: "True Range = max(H - L, |H - C_prev|, |L - C_prev|)",
          interpretation: "Yüksek ATR yüksek risk ve volatilite gösterir; stop-loss mesafelerinin daha geniş tutulmasını gerektirir.",
        };
      default:
        return {
          title: sigName,
          description: "Teknik analiz sinyali ve kural bazlı filtreleme.",
          interpretation: "AL, SAT veya NÖTR piyasa rejimini temsil eder.",
        };
    }
  };

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
            <p className="text-[11px] text-slate-400">
              {prediction.consensus_label || "Hisseye Özel + BIST Geneli Hibrit Model"}
            </p>
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
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Hedef Kapanış Fiyatı (Sonraki Gün)
            </span>
            <InfoTooltip
              title="Hedef Kapanış Fiyatı (T+1)"
              description="Hisseye özel Random Forest Regresyon modeli (%65) ile BIST geneli modelin (%35) bir sonraki işlem günü kapanışı için ürettiği ağırlıklı uzlaşı fiyatıdır."
              interpretation="Model kesin bir garanti vermez; piyasadaki ani haber akışları ve makroekonomik şoklar hedef fiyatı etkileyebilir."
            />
          </div>
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
            <div className="flex items-center justify-end gap-1">
              <span className="text-[11px] text-slate-400 block">
                %10-%90 Güven Aralığı
              </span>
              <InfoTooltip
                title="%10-%90 Güven Aralığı (Confidence Interval)"
                description="Topluluktaki (Ensemble) 100 karar ağacının tahmin dağılımının %10 ve %90 persentil sınırlarıdır."
                interpretation="Aralık dar olduğunda model ağaçlarının tahmini üzerindeki uzlaşısı yüksektir; aralık genişlediğinde volatilite ve belirsizlik artmıştır."
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
              ₺{prediction.price_range_low.toFixed(2)} - ₺{prediction.price_range_high.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Upward Probability Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-indigo-500" />
            <span>Yükseliş Olasılığı (Directional Probability)</span>
            <InfoTooltip
              title="Yükseliş Olasılığı (P_up)"
              description="Sınıflandırma modelindeki karar ağaçlarının sonraki günün pozitif getiri ile kapanacağına dair oy oranıdır."
              interpretation="≥%55 yükseliş (AL), ≤%45 düşüş (SAT), %45-%55 arası piyasa yönü belirsiz (NÖTR) kabul edilir."
            />
          </div>
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

      {/* Dedicated vs Global Model Consensus Breakdown */}
      {prediction.dedicated_model && (
        <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Hibrit Model Konsensüsü
              </span>
              <InfoTooltip
                title="Hibrit Model Mimarisi"
                description="BIST hisselerinin kendilerine has beta, hacim ve volatilite karakteristiği vardır. Tek bir model yerine iki bağımsız katman kullanılır."
                interpretation="Hissenin kendi geçmiş verisiyle eğitilen bağımsız modele %65 ağırlık, genel BIST piyasa modeline %35 ağırlık verilerek aşırı uyum (overfitting) ve piyasa gürültüsü engellenir."
              />
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              2 Katmanlı Ensemble
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {/* Dedicated Model */}
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <span>Hisseye Özel Model</span>
                <span className="text-blue-500 font-bold">%65</span>
              </div>
              <div className="space-y-0.5 font-mono">
                {prediction.dedicated_model.predicted_price && (
                  <p className="text-slate-900 dark:text-white font-bold text-xs">
                    ₺{prediction.dedicated_model.predicted_price.toFixed(2)}
                  </p>
                )}
                {prediction.dedicated_model.directional_accuracy && (
                  <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                    Doğruluk: %{(prediction.dedicated_model.directional_accuracy * 100).toFixed(1)}
                  </p>
                )}
                <p className="text-[10px] text-slate-400">
                  {prediction.dedicated_model.train_days || 1200}+ gün veri
                </p>
              </div>
            </div>

            {/* Global Model */}
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-semibold mb-1">
                <span>BIST Geneli Model</span>
                <span className="text-indigo-500 font-bold">%35</span>
              </div>
              <div className="space-y-0.5 font-mono">
                {prediction.global_model && (
                  <>
                    <p className="text-slate-900 dark:text-white font-bold text-xs">
                      ₺{prediction.global_model.predicted_price.toFixed(2)}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                      Benchmark: %{(prediction.global_model.benchmark_accuracy * 100).toFixed(1)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      BIST 30 Referans
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technical Signals Breakdown with Tooltips */}
      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 text-xs">
            <span>Teknik İndikatör Sinyalleri (5 Sinyal)</span>
            <InfoTooltip
              title="Teknik İndikatör Sinyalleri"
              description="RSI, MACD, Bollinger Bantları, Hareketli Ortalamalar ve ATR değerlerinin anlık formül analizidir."
              interpretation="Her indikatörün yanındaki (i) ikonuna tıklayarak veya fareyi üzerine getirerek detaylı yorumlama kılavuzunu inceleyebilirsiniz."
            />
          </div>
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

            const tooltipInfo = getSignalTooltipInfo(sig.name);

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {sig.name}
                    </span>
                    <InfoTooltip
                      title={tooltipInfo.title}
                      description={tooltipInfo.description}
                      formula={tooltipInfo.formula}
                      interpretation={tooltipInfo.interpretation}
                    />
                  </div>
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
          <strong>Yasal Uyarı (YTD):</strong> Bu veriler Scikit-Learn Random Forest regresyon ve sınıflandırma modelleri tarafından matematiksel olarak üretilmiştir. Kesinlikle yatırım tavsiyesi niteliği taşımaz.
        </span>
      </div>
    </div>
  );
};
