"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { PeriodType, StockDataPoint } from "@/types/stock";
import { SlidersHorizontal, Info, HelpCircle } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

interface StockChartProps {
  data: StockDataPoint[];
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  onOpenGlossary?: () => void;
  darkMode?: boolean;
}

const PERIODS: { key: PeriodType; label: string }[] = [
  { key: "1w", label: "1 Hafta" },
  { key: "1mo", label: "1 Ay" },
  { key: "3mo", label: "3 Ay" },
  { key: "6mo", label: "6 Ay" },
  { key: "1y", label: "1 Yıl" },
  { key: "2y", label: "2 Yıl" },
  { key: "5y", label: "5 Yıl" },
];

export const StockChart: React.FC<StockChartProps> = ({
  data,
  period,
  onPeriodChange,
  onOpenGlossary,
  darkMode = true,
}) => {
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [subChart, setSubChart] = useState<"RSI" | "MACD">("RSI");

  if (!data || data.length === 0) {
    return (
      <div className="card-panel rounded-2xl p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-xs text-slate-400">Grafik verisi yüklenemedi.</p>
      </div>
    );
  }

  // Calculate price bounds for Y-Axis
  const prices = data.map((d) => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceMargin = (maxPrice - minPrice) * 0.08 || 1;
  const yDomain = [
    Math.max(0, Math.floor(minPrice - priceMargin)),
    Math.ceil(maxPrice + priceMargin),
  ];

  const gridColor = darkMode ? "#1e293b" : "#f1f5f9";
  const axisColor = darkMode ? "#64748b" : "#94a3b8";

  return (
    <div className="card-panel rounded-2xl p-5 sm:p-6 space-y-6">
      {/* Chart Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Period Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 self-start">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => onPeriodChange(p.key)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                period === p.key
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Indicators Toggle */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 text-[11px] font-medium mr-1">
            <SlidersHorizontal className="w-3 h-3" />
            İndikatörler:
          </span>

          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => setShowSMA20(!showSMA20)}
              title="SMA 20: 20 günlük basit hareketli ortalama"
              className={`px-2.5 py-1 rounded-lg border font-medium transition flex items-center gap-1.5 ${
                showSMA20
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="w-2 h-0.5 bg-amber-500 rounded" />
              SMA 20
            </button>
            <InfoTooltip
              title="SMA 20 (20 Günlük Basit Hareketli Ortalama)"
              description="Son 20 işlem gününün kapanış fiyatlarının aritmetik ortalamasıdır. Kısa vadeli trend desteği veya direnci olarak çalışır."
              formula="SMA_20 = ∑(Kapanış_t) / 20"
              interpretation="Fiyat SMA 20'nin üzerindeyse kısa vadeli yükseliş eğilimi güçlenir."
            />
          </div>

          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => setShowSMA50(!showSMA50)}
              title="SMA 50: 50 günlük basit hareketli ortalama"
              className={`px-2.5 py-1 rounded-lg border font-medium transition flex items-center gap-1.5 ${
                showSMA50
                  ? "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400 font-semibold"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="w-2 h-0.5 bg-sky-500 rounded" />
              SMA 50
            </button>
            <InfoTooltip
              title="SMA 50 (50 Günlük Basit Hareketli Ortalama)"
              description="Son 50 işlem gününün ortalamasıdır. Orta vadeli ana piyasa yönünü belirler."
              formula="SMA_50 = ∑(Kapanış_t) / 50"
              interpretation="SMA 20'nin SMA 50'yi yukarı kesmesi 'Altın Kesişim' (Golden Cross), aşağı kesmesi 'Ölüm Kesişimi' (Death Cross) sinyalidir."
            />
          </div>

          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              title="Bollinger Bantları: 20 günlük ortalamaya 2 standart sapma mesafedeki alt ve üst bantlar"
              className={`px-2.5 py-1 rounded-lg border font-medium transition flex items-center gap-1.5 ${
                showBollinger
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 font-semibold"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="w-2 h-0.5 bg-purple-500 rounded" />
              Bollinger
            </button>
            <InfoTooltip
              title="Bollinger Bantları (20, 2)"
              description="20 günlük hareketli ortalamanın 2 standart sapma üstü ve altı alınarak hesaplanan volatilite kanallarıdır."
              formula="Üst = SMA20 + 2σ | Alt = SMA20 - 2σ"
              interpretation="Fiyat üst banda değdiğinde aşırı alım, alt banda değdiğinde aşırı satım kabul edilir. Bantların daralması sert kırılım habercisidir."
            />
          </div>
        </div>
      </div>

      {/* Main Price Chart */}
      <div className="h-80 sm:h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={axisColor}
              fontSize={11}
              tickLine={false}
              tickFormatter={(val) => {
                const parts = val.split("-");
                return `${parts[2]}/${parts[1]}`;
              }}
              minTickGap={35}
            />
            <YAxis
              domain={yDomain}
              stroke={axisColor}
              fontSize={11}
              tickLine={false}
              orientation="right"
              tickFormatter={(val) => `₺${val}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as StockDataPoint;
                return (
                  <div className="card-panel rounded-xl p-3 text-xs space-y-1.5 shadow-xl">
                    <p className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1">
                      {d.date}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300">
                      <span>Kapanış: <b className="text-slate-900 dark:text-white">₺{d.close.toFixed(2)}</b></span>
                      <span>Açılış: ₺{d.open.toFixed(2)}</span>
                      <span>En Yüksek: ₺{d.high.toFixed(2)}</span>
                      <span>En Düşük: ₺{d.low.toFixed(2)}</span>
                      {showSMA20 && <span className="text-amber-500 font-semibold">SMA 20: ₺{d.sma_20.toFixed(2)}</span>}
                      {showSMA50 && <span className="text-sky-500 font-semibold">SMA 50: ₺{d.sma_50.toFixed(2)}</span>}
                      <span>RSI (14): {d.rsi_14.toFixed(1)}</span>
                      <span>MACD: {d.macd.toFixed(3)}</span>
                    </div>
                  </div>
                );
              }}
            />

            {/* Bollinger Band Upper & Lower */}
            {showBollinger && (
              <>
                <Line
                  type="monotone"
                  dataKey="bb_upper"
                  stroke="#a855f7"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="bb_lower"
                  stroke="#a855f7"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}

            {/* Price Area */}
            <Area
              type="monotone"
              dataKey="close"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#priceGradient)"
              isAnimationActive={true}
            />

            {/* SMA 20 Line */}
            {showSMA20 && (
              <Line
                type="monotone"
                dataKey="sma_20"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* SMA 50 Line */}
            {showSMA50 && (
              <Line
                type="monotone"
                dataKey="sma_50"
                stroke="#0284c7"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-Chart (RSI / MACD) Selector & View */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setSubChart("RSI")}
                title="Göreceli Güç Endeksi: Aşırı alım (≥70) ve aşırı satım (≤30) bölgeleri"
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  subChart === "RSI"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                RSI (14)
              </button>
              <InfoTooltip
                title="RSI (14 Günlük Göreceli Güç Endeksi)"
                description="Momentum osilatörüdür. 0-100 arasında salınır. 70 seviyesi aşırı alım, 30 seviyesi aşırı satım eşiğidir."
                formula="RSI = 100 - [100 / (1 + RS)]"
                interpretation="70 üzeri seviyelerde kar realizasyonu riski, 30 altı seviyelerde tepki alımı potansiyeli artar."
              />
            </div>
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => setSubChart("MACD")}
                title="MACD: 12 ve 26 günlük EMA farkı ve 9 günlük sinyal çizgisi kesişimleri"
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  subChart === "MACD"
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                MACD
              </button>
              <InfoTooltip
                title="MACD (Moving Average Convergence Divergence)"
                description="Kısa ve uzun vadeli üssel hareketli ortalamaların farkıdır. Histogram yeşil ise alıcılar, kırmızı ise satıcılar baskındır."
                formula="MACD = EMA(12) - EMA(26) | Sinyal = EMA_9(MACD)"
                interpretation="MACD çizgisinin sinyal çizgisini yukarı kesmesi AL, aşağı kesmesi SAT sinyalidir."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              {subChart === "RSI"
                ? "Aşırı Alım: 70 | Aşırı Satım: 30"
                : "Yeşil: Pozitif Momentum | Kırmızı: Negatif Momentum"}
            </span>
            {onOpenGlossary && (
              <button
                onClick={onOpenGlossary}
                className="text-slate-400 hover:text-blue-500 transition p-1"
                title="İndikatör detaylarını ve yorumlama kurallarını görüntüle"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {subChart === "RSI" ? (
              <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  domain={[0, 100]}
                  ticks={[30, 50, 70]}
                  stroke={axisColor}
                  fontSize={10}
                  tickLine={false}
                  orientation="right"
                />
                <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
                <Line
                  type="monotone"
                  dataKey="rsi_14"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            ) : (
              <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis stroke={axisColor} fontSize={10} tickLine={false} orientation="right" />
                <Bar
                  dataKey="macd_hist"
                  fill="#3b82f6"
                  isAnimationActive={false}
                  shape={(props: any) => {
                    const { x, y, width, height, value } = props;
                    const fill = value >= 0 ? "#10b981" : "#f43f5e";
                    return <rect x={x} y={y} width={width} height={height} fill={fill} rx={1} />;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="macd"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="macd_signal"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
