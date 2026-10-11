"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, X } from "lucide-react";

interface InfoTooltipProps {
  title: string;
  description: string;
  interpretation?: string;
  formula?: string;
  className?: string;
  placement?: "top" | "bottom" | "auto";
  align?: "center" | "left" | "right";
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  title,
  description,
  interpretation,
  formula,
  className = "",
  placement = "auto",
  align = "center",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [computedPlacement, setComputedPlacement] = useState<"top" | "bottom">(
    placement === "bottom" ? "bottom" : "top"
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto calculate placement if needed
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (placement === "auto") {
        const rect = containerRef.current.getBoundingClientRect();
        // If within 240px from top of viewport, open downwards
        if (rect.top < 240) {
          setComputedPlacement("bottom");
        } else {
          setComputedPlacement("top");
        }
      } else {
        setComputedPlacement(placement);
      }
    }
  }, [isOpen, placement]);

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

  // Horizontal alignment classes
  const alignClass =
    align === "right"
      ? "right-0"
      : align === "left"
      ? "left-0"
      : "left-1/2 -translate-x-1/2";

  // Arrow alignment
  const arrowAlign =
    align === "right"
      ? "right-3"
      : align === "left"
      ? "left-3"
      : "left-1/2 -translate-x-1/2";

  // Vertical placement classes
  const isTop = computedPlacement === "top";
  const posClass = isTop
    ? "bottom-full mb-2.5"
    : "top-full mt-2.5";

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
        className="p-1 rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition focus:outline-none"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${posClass} ${alignClass} w-72 sm:w-84 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl z-[9999] text-left space-y-2.5 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto`}
          style={{ minWidth: "18rem" }}
        >
          {/* Triangle arrow */}
          <div
            className={`absolute ${arrowAlign} w-2.5 h-2.5 rotate-45 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 ${
              isTop
                ? "top-full -mt-1.5 border-r border-b"
                : "bottom-full -mb-1.5 border-l border-t"
            }`}
          />

          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">
              {title}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition p-0.5"
              aria-label="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
            {description}
          </p>

          {/* Formula */}
          {formula && (
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto select-all">
              <code>{formula}</code>
            </div>
          )}

          {/* Interpretation / How to read */}
          {interpretation && (
            <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-start gap-1.5">
              <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">İpucu:</span>
              <span className="leading-normal">{interpretation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
