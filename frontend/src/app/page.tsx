"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { TickerSearch } from "@/components/TickerSearch";
import { StockHeader } from "@/components/StockHeader";
import { StockChart } from "@/components/StockChart";
import { PredictionCard } from "@/components/PredictionCard";
import { ModelInfoModal } from "@/components/ModelInfoModal";
import {
  HistoricalResponse,
  PeriodType,
  PredictionResponse,
} from "@/types/stock";
import { getHistorical, getPrediction, getHealth } from "@/lib/api";
import { RotateCw, AlertCircle, Info } from "lucide-react";

export default function DashboardPage() {
  const [ticker, setTicker] = useState<string>("THYAO.IS");
  const [period, setPeriod] = useState<PeriodType>("1y");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [modelReady, setModelReady] = useState<boolean>(true);

  // Data states
  const [historicalData, setHistoricalData] = useState<HistoricalResponse | null>(null);
  const [isHistLoading, setIsHistLoading] = useState<boolean>(true);
  const [histError, setHistError] = useState<string | null>(null);

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isPredLoading, setIsPredLoading] = useState<boolean>(true);
  const [predError, setPredError] = useState<string | null>(null);

  // Initialize theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : true;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleToggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Health check
  useEffect(() => {
    getHealth()
      .then((res) => setModelReady(res.model_ready))
      .catch(() => setModelReady(false));
  }, []);

  // Fetch stock historical data
  const loadHistorical = useCallback(async (sym: string, per: PeriodType) => {
    setIsHistLoading(true);
    setHistError(null);
    try {
      const data = await getHistorical(sym, per);
      setHistoricalData(data);
    } catch (err: any) {
      setHistError(err.message || "Hisse verisi çekilemedi.");
      setHistoricalData(null);
    } finally {
      setIsHistLoading(false);
    }
  }, []);

  // Fetch ML prediction
  const loadPrediction = useCallback(async (sym: string) => {
    setIsPredLoading(true);
    setPredError(null);
    try {
      const data = await getPrediction(sym);
      setPrediction(data);
    } catch (err: any) {
      setPredError(err.message || "Tahmin hesaplanamadı.");
      setPrediction(null);
    } finally {
      setIsPredLoading(false);
    }
  }, []);

  // Trigger data fetching on ticker/period change
  useEffect(() => {
    loadHistorical(ticker, period);
    loadPrediction(ticker);
  }, [ticker, period, loadHistorical, loadPrediction]);

  const handleSelectTicker = (selected: string) => {
    const formatted = selected.includes(".") ? selected : `${selected}.IS`;
    setTicker(formatted);
  };

  const handleRefresh = () => {
    loadHistorical(ticker, period);
    loadPrediction(ticker);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navbar */}
      <Navbar
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
        onOpenModelInfo={() => setIsModelModalOpen(true)}
        modelReady={modelReady}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Controls: Search and Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TickerSearch
            currentTicker={ticker}
            onSelectTicker={handleSelectTicker}
            isLoading={isHistLoading}
          />
          <button
            onClick={handleRefresh}
            disabled={isHistLoading || isPredLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 shadow-sm transition self-end sm:self-auto shrink-0 disabled:opacity-50"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${
                isHistLoading || isPredLoading ? "animate-spin text-blue-500" : ""
              }`}
            />
            <span>Yenile</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {histError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Hisse Verisi Alınamadı</p>
              <p className="text-xs opacity-90">{histError}</p>
            </div>
          </div>
        )}

        {/* Stock Header Price & Stats */}
        {historicalData && (
          <StockHeader
            ticker={historicalData.ticker}
            companyName={historicalData.name}
            summary={historicalData.summary}
            lastDate={
              historicalData.data[historicalData.data.length - 1]?.date
            }
          />
        )}

        {/* Core Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {historicalData ? (
              <StockChart
                data={historicalData.data}
                period={period}
                onPeriodChange={(p) => setPeriod(p)}
                darkMode={darkMode}
              />
            ) : isHistLoading ? (
              <div className="glass-panel rounded-2xl p-12 min-h-[460px] flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">
                  {ticker} geçmiş verileri ve indikatörler yükleniyor...
                </p>
              </div>
            ) : null}
          </div>

          {/* AI Prediction Column (1 Col) */}
          <div className="space-y-6">
            <PredictionCard
              prediction={prediction}
              isLoading={isPredLoading}
              error={predError}
              onRetry={() => loadPrediction(ticker)}
            />

            {/* Quick Helper Info Box */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>Teknik Göstergeler Nasıl Okunur?</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                <strong>SMA 20 & 50:</strong> 20 günlük ortalamanın 50 günlüğü yukarı kesmesi yükseliş (Golden Cross), aşağı kesmesi düşüş sinyalidir.
              </p>
              <p className="text-[11px] leading-relaxed">
                <strong>RSI (14):</strong> 70 üzeri aşırı alım, 30 altı aşırı satım bölgesidir.
              </p>
              <p className="text-[11px] leading-relaxed">
                <strong>MACD:</strong> Histogramın sıfırın üzerine çıkması pozitif momentum işaretidir.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 AI-Powered Financial Stock Analysis Dashboard • BIST 100</p>
          <p className="text-[11px]">
            FastAPI • Next.js 15 • Scikit-Learn • yfinance
          </p>
        </div>
      </footer>

      {/* Model Information Modal */}
      <ModelInfoModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />
    </div>
  );
}
