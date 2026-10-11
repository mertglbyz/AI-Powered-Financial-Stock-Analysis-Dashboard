"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { TickerSearch } from "@/components/TickerSearch";
import { StockHeader } from "@/components/StockHeader";
import { StockChart } from "@/components/StockChart";
import { PredictionCard } from "@/components/PredictionCard";
import { MarketOverview } from "@/components/MarketOverview";
import { ModelInfoModal } from "@/components/ModelInfoModal";
import { GlossaryModal } from "@/components/GlossaryModal";
import {
  HistoricalResponse,
  PeriodType,
  PredictionResponse,
  MarketOverviewResponse,
} from "@/types/stock";
import {
  getHistorical,
  getPrediction,
  getHealth,
  getMarketOverview,
} from "@/lib/api";
import {
  RotateCw,
  AlertCircle,
  Info,
  BookOpen,
  Layers,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<"dashboard" | "stock">("dashboard");
  const [ticker, setTicker] = useState<string>("THYAO.IS");
  const [period, setPeriod] = useState<PeriodType>("1y");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isModelModalOpen, setIsModelModalOpen] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [modelReady, setModelReady] = useState<boolean>(true);

  // Market overview state
  const [marketOverview, setMarketOverview] = useState<MarketOverviewResponse | null>(null);
  const [isOverviewLoading, setIsOverviewLoading] = useState<boolean>(true);

  // Stock data states
  const [historicalData, setHistoricalData] = useState<HistoricalResponse | null>(null);
  const [isHistLoading, setIsHistLoading] = useState<boolean>(false);
  const [histError, setHistError] = useState<string | null>(null);

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isPredLoading, setIsPredLoading] = useState<boolean>(false);
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

  // Fetch market overview
  const loadMarketOverview = useCallback(async () => {
    setIsOverviewLoading(true);
    try {
      const data = await getMarketOverview();
      setMarketOverview(data);
    } catch (err) {
      console.error("Market overview load error:", err);
    } finally {
      setIsOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarketOverview();
  }, [loadMarketOverview]);

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

  // When switching to stock view or changing ticker/period
  useEffect(() => {
    if (activeView === "stock") {
      loadHistorical(ticker, period);
      loadPrediction(ticker);
    }
  }, [activeView, ticker, period, loadHistorical, loadPrediction]);

  const handleSelectTicker = (selected: string) => {
    const formatted = selected.includes(".") ? selected : `${selected}.IS`;
    setTicker(formatted);
    setActiveView("stock");
  };

  const handleRefresh = () => {
    if (activeView === "dashboard") {
      loadMarketOverview();
    } else {
      loadHistorical(ticker, period);
      loadPrediction(ticker);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navbar with tabs */}
      <Navbar
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
        onOpenModelInfo={() => setIsModelModalOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        modelReady={modelReady}
        activeView={activeView}
        onViewChange={(view) => setActiveView(view)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Action Bar (Universal Search + Refresh) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {activeView === "stock" && (
              <button
                onClick={() => setActiveView("dashboard")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-500 border border-slate-200 dark:border-slate-700 shadow-sm transition shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Piyasa Paneli</span>
              </button>
            )}
            <div className="w-full">
              <TickerSearch
                currentTicker={ticker}
                onSelectTicker={handleSelectTicker}
                isLoading={isHistLoading}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isHistLoading || isPredLoading || isOverviewLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-sm transition disabled:opacity-50"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${
                  isHistLoading || isPredLoading || isOverviewLoading
                    ? "animate-spin text-blue-500"
                    : ""
                }`}
              />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: Market Overview Dashboard (Default Landing) */}
        {activeView === "dashboard" && (
          <MarketOverview
            overview={marketOverview}
            isLoading={isOverviewLoading}
            onSelectStock={handleSelectTicker}
            onOpenModelInfo={() => setIsModelModalOpen(true)}
            onOpenGlossary={() => setIsGlossaryOpen(true)}
          />
        )}

        {/* VIEW 2: Stock Deep Dive & AI Prediction */}
        {activeView === "stock" && (
          <div className="space-y-6">
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
                    onOpenGlossary={() => setIsGlossaryOpen(true)}
                    darkMode={darkMode}
                  />
                ) : isHistLoading ? (
                  <div className="card-panel rounded-2xl p-12 min-h-[460px] flex flex-col items-center justify-center space-y-3">
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
                  onOpenGlossary={() => setIsGlossaryOpen(true)}
                />

                {/* Quick Helper Info Box */}
                <div className="card-panel rounded-2xl p-4 text-xs text-slate-500 dark:text-slate-400 space-y-2.5">
                  <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span>Teknik Göstergeler Özeti</span>
                    </div>
                    <button
                      onClick={() => setIsGlossaryOpen(true)}
                      className="text-blue-500 hover:underline text-[11px] font-medium"
                    >
                      Sözlüğü Aç &rarr;
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    <strong>SMA 20 & 50:</strong> 20 günlük ortalamanın 50 günlüğü yukarı kesmesi yükseliş (Golden Cross), aşağı kesmesi düşüş (Death Cross) sinyalidir.
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    <strong>RSI (14):</strong> 70 üzeri aşırı alım bölgesi (düzeltme riski), 30 altı aşırı satım bölgesi (tepki alımı fırsatı).
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    <strong>MACD:</strong> Histogram barlarının sıfırın üzerine çıkması pozitif ivme işaretidir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 AI-Powered Financial Stock Analysis Dashboard • BIST 100 & Tüm Hisseler</p>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setActiveView("dashboard")}
              className="text-slate-400 hover:text-blue-500 transition"
            >
              Piyasa Dashboard
            </button>
            <button
              onClick={() => setIsGlossaryOpen(true)}
              className="text-slate-400 hover:text-blue-500 transition"
            >
              Terimler Sözlüğü
            </button>
            <button
              onClick={() => setIsModelModalOpen(true)}
              className="text-slate-400 hover:text-blue-500 transition"
            >
              Model Mimarisi
            </button>
            <span>FastAPI • Next.js 15 • Scikit-Learn</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ModelInfoModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
}
