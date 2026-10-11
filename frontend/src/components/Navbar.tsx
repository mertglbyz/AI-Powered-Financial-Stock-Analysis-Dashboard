"use client";

import React from "react";
import { Activity, Brain, Moon, Sun, Cpu } from "lucide-react";

interface NavbarProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenModelInfo: () => void;
  modelReady: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleTheme,
  onOpenModelInfo,
  modelReady,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-600 dark:from-blue-400 dark:via-indigo-300 dark:to-emerald-400 bg-clip-text text-transparent">
                BIST AI Analytics
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                PRO ML
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Yapay Zeka Destekli Borsa İstanbul Analiz Paneli
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Model Status Pill */}
          <button
            onClick={onOpenModelInfo}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
            title="Model detaylarını ve metrikleri görüntüle"
          >
            <Brain className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Model Metrikleri</span>
            <span
              className={`w-2 h-2 rounded-full ${
                modelReady ? "bg-emerald-500 shadow-sm shadow-emerald-500" : "bg-amber-500 animate-ping"
              }`}
            />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Tema Değiştir"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
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
