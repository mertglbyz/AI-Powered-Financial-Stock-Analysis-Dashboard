"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, X } from "lucide-react";

interface InfoTooltipProps {
  title: string;
  description: string;
  interpretation?: string;
  formula?: string;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  description,
  interpretation,
  formula,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label={`${title} hakkında bilgi`}
        className="p-0.5 rounded-full text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 rounded-xl card-panel shadow-2xl z-50 text-left space-y-2 animate-in fade-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-700 pointer-events-auto"
        >
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 rotate-45 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-700" />

          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              {title}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Description */}
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
          </p>

          {/* Formula */}
          {formula && (
            <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300 overflow-x-auto">
              <code>{formula}</code>
            </div>
          )}

          {/* Interpretation / How to read */}
          {interpretation && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800 flex items-start gap-1">
              <span className="font-semibold text-blue-500 shrink-0">İpucu:</span>
              <span>{interpretation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
