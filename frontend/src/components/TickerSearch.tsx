"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { TickerItem } from "@/types/stock";
import { searchTickers } from "@/lib/api";

const QUICK_TICKERS = [
  "THYAO",
  "GARAN",
  "ASELS",
  "BIMAS",
  "KCHOL",
  "EREGL",
  "TUPRS",
  "PGSUS",
  "SISE",
  "AKBNK",
];

interface TickerSearchProps {
  currentTicker: string;
  onSelectTicker: (ticker: string) => void;
  isLoading?: boolean;
}

export const TickerSearch: React.FC<TickerSearchProps> = ({
  currentTicker,
  onSelectTicker,
  isLoading = false,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TickerItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search debounce
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const items = await searchTickers(query, 12);
        setResults(items);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Ticker arama hatası:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (symbol: string) => {
    onSelectTicker(symbol);
    setIsOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex].symbol);
      } else if (query.trim()) {
        handleSelect(query.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const cleanCurrentCode = currentTicker.replace(".IS", "");

  return (
    <div className="w-full space-y-3">
      {/* Search Input Bar */}
      <div ref={containerRef} className="relative w-full max-w-2xl">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Hisse ara (örn: THYAO, Garanti, Aselsan, EREGL)..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-slate-100 placeholder-slate-400 shadow-sm transition"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Suggestion Dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-80 overflow-y-auto rounded-xl glass-panel shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {isSearching ? (
              <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                Aranıyor...
              </div>
            ) : results.length > 0 ? (
              results.map((item, idx) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSelect(item.symbol)}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between text-sm transition ${
                    idx === selectedIndex
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.code}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    BIST
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                {query ? `"${query}" ile eşleşen hisse bulunamadı.` : "Aramak için hisse adı veya kodu yazın."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Ticker Chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
          <TrendingUp className="w-3 h-3" />
          Popüler:
        </span>
        {QUICK_TICKERS.map((t) => {
          const isSelected = cleanCurrentCode === t;
          return (
            <button
              key={t}
              onClick={() => onSelectTicker(t)}
              disabled={isLoading && isSelected}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                isSelected
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
};
