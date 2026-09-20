"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, ThemeId } from "./ThemeProvider";
import { Palette, Check } from "lucide-react";

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme, themeOptions, currentThemeOption } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 sm:px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all text-xs font-semibold shadow-sm"
        style={{
          backgroundColor: "var(--bg-surface-elevated)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
        }}
        title="Change Visual Theme"
      >
        <span
          className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10 shrink-0"
          style={{ backgroundColor: currentThemeOption.accentHex }}
        />
        <Palette className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden md:inline font-medium">{currentThemeOption.name}</span>
      </button>

      {isOpen && (
        <div
          className="fixed top-16 left-4 right-4 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:w-80 mt-2 rounded-2xl border p-2 z-50 shadow-2xl backdrop-blur-xl animate-fade-in max-h-[80vh] overflow-y-auto"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-medium)",
          }}
        >
          <div className="px-3 py-2 border-b mb-1 flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <Palette className="w-3.5 h-3.5" style={{ color: "var(--text-primary)" }} />
              Minimal Themes
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border" style={{ backgroundColor: "var(--bg-surface-elevated)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
              4 Styles
            </span>
          </div>

          <div className="space-y-1">
            {themeOptions.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                    isSelected ? "ring-1" : "hover:brightness-110"
                  }`}
                  style={{
                    backgroundColor: isSelected ? "var(--bg-surface-elevated)" : "transparent",
                    borderColor: isSelected ? opt.accentHex : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-inner shrink-0"
                      style={{
                        backgroundColor: opt.bgHex,
                        borderColor: opt.borderHex,
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: opt.accentHex }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                          {opt.name}
                        </span>
                        <span
                          className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded font-semibold"
                          style={{
                            backgroundColor: `${opt.accentHex}20`,
                            color: opt.accentHex,
                          }}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10px] leading-tight line-clamp-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-2"
                      style={{ backgroundColor: opt.accentHex, color: "#ffffff" }}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
