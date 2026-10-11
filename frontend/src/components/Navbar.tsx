"use client";

import React from "react";
import { Activity, Brain, Moon, Sun, BookOpen, Layers } from "lucide-react";

interface NavbarProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenModelInfo: () => void;
  onOpenGlossary: () => void;
  modelReady: boolean;
  activeView?: "dashboard" | "stock";
  onViewChange?: (view: "dashboard" | "stock") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleTheme,
  onOpenModelInfo,
  onOpenGlossary,
  modelReady,
  activeView = "dashboard",
  onViewChange,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full card-panel border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => onViewChange && onViewChange("dashboard")}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-600 dark:from-blue-400 dark:via-indigo-300 dark:to-emerald-400 bg-clip-text text-transparent">
                BIST AI Analytics
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                PRO ML
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Yapay Zeka Destekli Borsa İstanbul Analiz Paneli
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Dashboard vs Stock Analysis) */}
        {onViewChange && (
          <nav className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80">
            <button
              onClick={() => onViewChange("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === "dashboard"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Piyasa Dashboard</span>
            </button>
            <button
              onClick={() => onViewChange("stock")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeView === "stock"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Hisse Detay & Tahmin</span>
            </button>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Stock Coverage Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Borsa İstanbul (550+ Hisse)</span>
          </div>

          {/* Glossary Button */}
          <button
            onClick={onOpenGlossary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            title="İndikatörler ve terimler sözlüğü"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden md:inline">Terimler Sözlüğü</span>
          </button>

          {/* Model Status Pill */}
          <button
            onClick={onOpenModelInfo}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            title="Model detaylarını ve metrikleri görüntüle"
          >
            <Brain className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">Model Metrikleri</span>
            <span
              className={`w-2 h-2 rounded-full ${
                modelReady
                  ? "bg-emerald-500 shadow-sm shadow-emerald-500"
                  : "bg-amber-500 animate-ping"
              }`}
            />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Tema Değiştir"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
