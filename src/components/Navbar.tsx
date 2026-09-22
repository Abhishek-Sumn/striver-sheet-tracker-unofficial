"use client";

import React from "react";
import { Shuffle, Download, Flame, Check, Palette } from "lucide-react";
import { SheetKey } from "../types/sheet";
import { ThemeMode } from "../hooks/useTheme";

interface NavbarProps {
  activeSheet: "ALL" | SheetKey;
  onSelectSheet: (sheet: "ALL" | SheetKey) => void;
  totalSolved: number;
  totalProblems: number;
  streakCount: number;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onOpenRandom: () => void;
  onOpenBackup: () => void;
  onReset?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSheet,
  onSelectSheet,
  totalSolved,
  totalProblems,
  streakCount,
  theme = "orange",
  onToggleTheme,
  onOpenRandom,
  onOpenBackup,
}) => {
  const percent = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;
  const isStreakActive = streakCount > 0;
  const isOrange = theme === "orange";

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
      isOrange
        ? "border-orange-950/80 bg-black/90"
        : "border-zinc-800/80 bg-zinc-950/90"
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left branding */}
        <div className="flex items-center gap-3.5">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold shadow-sm transition-colors ${
            isOrange
              ? "border-orange-500/50 bg-black text-orange-400 shadow-orange-950/50"
              : "border-zinc-700 bg-zinc-900 text-zinc-100"
          }`}>
            DSA
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white">
              DSA Tracker
            </span>
            <span className="hidden text-zinc-600 sm:inline">/</span>
            <span className="hidden text-sm text-zinc-400 sm:inline font-medium">
              A2Z & SDE Sheets
            </span>
          </div>
        </div>

        {/* Right stats & utility actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Switcher Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={`Currently in ${isOrange ? "Orange & Black" : "Dark Zinc"} theme. Click to toggle.`}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                isOrange
                  ? "border-orange-500/40 bg-orange-500/15 text-orange-300 hover:border-orange-500/70"
                  : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <Palette className={`h-3.5 w-3.5 ${isOrange ? "text-orange-400" : "text-zinc-400"}`} />
              <span className="hidden sm:inline">
                {isOrange ? "Orange & Black" : "Dark Zinc"}
              </span>
            </button>
          )}

          {/* Streak Indicator */}
          <div
            title={isStreakActive ? `${streakCount} Day Active Streak` : "Solve a problem today to build your streak"}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              isStreakActive
                ? isOrange
                  ? "border-orange-500/50 bg-orange-500/20 text-orange-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-500"
            }`}
          >
            <Flame className={`h-4 w-4 ${isStreakActive ? "text-orange-400" : "text-zinc-600"}`} />
            <span className="font-semibold">{streakCount}</span>
            <span className="hidden md:inline text-xs opacity-75">day streak</span>
          </div>

          {/* Overall Progress pill */}
          <div
            title={`${totalSolved} of ${totalProblems} problems solved (${percent}%)`}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium ${
              isOrange
                ? "border-orange-950 bg-zinc-950 text-zinc-200"
                : "border-zinc-800 bg-zinc-900/60 text-zinc-300"
            }`}
          >
            <Check className="h-4 w-4 text-emerald-400 stroke-[2.5]" />
            <span className="font-mono font-semibold text-white">{totalSolved}</span>
            <span className="text-zinc-500">/</span>
            <span className="font-mono text-zinc-400">{totalProblems}</span>
            <span className={`ml-1 rounded px-1.5 py-0.5 text-xs font-mono font-medium ${
              isOrange ? "bg-orange-500/15 text-orange-300" : "bg-zinc-800 text-zinc-300"
            }`}>
              {percent}%
            </span>
          </div>

          <div className="h-5 w-[1px] bg-zinc-800 mx-0.5 hidden sm:block" />

          {/* Random Problem Shuffler */}
          <button
            onClick={onOpenRandom}
            title="Pick a random unsolved problem"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              isOrange
                ? "border-orange-900/60 bg-zinc-950 text-zinc-300 hover:border-orange-500/50 hover:text-orange-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
            }`}
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Random</span>
          </button>

          {/* Backup / Export / Import */}
          <button
            onClick={onOpenBackup}
            title="Export or Import your progress"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              isOrange
                ? "border-orange-900/60 bg-zinc-950 text-zinc-300 hover:border-orange-500/50 hover:text-orange-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Backup</span>
          </button>
        </div>
      </div>
    </header>
  );
};
