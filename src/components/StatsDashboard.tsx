"use client";

import React, { useState } from "react";
import { SheetKey } from "../types/sheet";
import { Target, ChevronDown, ChevronUp } from "lucide-react";
import { ThemeMode } from "../hooks/useTheme";

interface StatsData {
  total: number;
  solved: number;
  percentage: number;
  bookmarked: number;
  solvedToday: number;
  easy: { total: number; solved: number };
  medium: { total: number; solved: number };
  hard: { total: number; solved: number };
}

interface StatsDashboardProps {
  stats: {
    overall: StatsData;
    sde: StatsData;
    a2z: StatsData;
    streak: { count: number; lastActiveDate: string };
    dailyGoal: number;
  };
  activeSheet: "ALL" | SheetKey;
  theme?: ThemeMode;
  onSelectSheet: (sheet: "ALL" | SheetKey) => void;
  onUpdateDailyGoal: (goal: number) => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  activeSheet,
  theme = "orange",
  onSelectSheet,
  onUpdateDailyGoal,
}) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(stats.dailyGoal.toString());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isOrange = theme === "orange";

  const currentStats =
    activeSheet === "SDE" ? stats.sde : activeSheet === "A2Z" ? stats.a2z : stats.overall;

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(goalInput, 10);
    if (!isNaN(val) && val > 0 && val <= 50) {
      onUpdateDailyGoal(val);
      setIsEditingGoal(false);
    }
  };

  const easyPct = currentStats.total > 0 ? (currentStats.easy.solved / currentStats.total) * 100 : 0;
  const medPct = currentStats.total > 0 ? (currentStats.medium.solved / currentStats.total) * 100 : 0;
  const hardPct = currentStats.total > 0 ? (currentStats.hard.solved / currentStats.total) * 100 : 0;

  return (
    <div className={`rounded-xl border transition-colors ${
      isOrange
        ? "border-orange-950/60 bg-zinc-950/90 shadow-sm"
        : "border-zinc-800 bg-zinc-900/50"
    }`}>
      {/* Compact Main Row */}
      <div className="flex flex-col gap-3.5 p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Sheet Switcher & Main Progress */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          {/* Segmented Sheet Switcher */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-black p-1">
            <button
              onClick={() => onSelectSheet("ALL")}
              className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                activeSheet === "ALL"
                  ? isOrange
                    ? "bg-orange-500 text-black font-bold shadow-sm shadow-orange-500/20"
                    : "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Sheets{" "}
              <span className={`ml-1 text-xs font-mono ${
                activeSheet === "ALL" ? (isOrange ? "text-black/80 font-bold" : "text-zinc-400") : "text-zinc-500"
              }`}>
                ({stats.overall.solved}/{stats.overall.total})
              </span>
            </button>
            <button
              onClick={() => onSelectSheet("SDE")}
              className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                activeSheet === "SDE"
                  ? isOrange
                    ? "bg-orange-500 text-black font-bold shadow-sm shadow-orange-500/20"
                    : "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              SDE Sheet{" "}
              <span className={`ml-1 text-xs font-mono ${
                activeSheet === "SDE" ? (isOrange ? "text-black/80 font-bold" : "text-zinc-400") : "text-zinc-500"
              }`}>
                ({stats.sde.solved}/{stats.sde.total})
              </span>
            </button>
            <button
              onClick={() => onSelectSheet("A2Z")}
              className={`rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                activeSheet === "A2Z"
                  ? isOrange
                    ? "bg-orange-500 text-black font-bold shadow-sm shadow-orange-500/20"
                    : "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              A2Z DSA{" "}
              <span className={`ml-1 text-xs font-mono ${
                activeSheet === "A2Z" ? (isOrange ? "text-black/80 font-bold" : "text-zinc-400") : "text-zinc-500"
              }`}>
                ({stats.a2z.solved}/{stats.a2z.total})
              </span>
            </button>
          </div>

          {/* Quick Stat Pill */}
          <div className="flex items-baseline gap-2 font-mono">
            <span className={`text-lg sm:text-xl font-bold ${
              isOrange ? "text-orange-400" : "text-white"
            }`}>
              {currentStats.percentage}%
            </span>
            <span className="text-xs sm:text-sm text-zinc-400">completed</span>
          </div>
        </div>

        {/* Right: Difficulty breakdown & Daily goal */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs sm:text-sm">
          {/* Difficulty Counters */}
          <div className="flex items-center gap-3.5 font-mono">
            <div className="flex items-center gap-1.5" title="Easy problems solved">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="font-semibold text-zinc-200">{currentStats.easy.solved}</span>
              <span className="text-zinc-500">/{currentStats.easy.total}</span>
            </div>

            <div className="flex items-center gap-1.5" title="Medium problems solved">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="font-semibold text-zinc-200">{currentStats.medium.solved}</span>
              <span className="text-zinc-500">/{currentStats.medium.total}</span>
            </div>

            <div className="flex items-center gap-1.5" title="Hard problems solved">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="font-semibold text-zinc-200">{currentStats.hard.solved}</span>
              <span className="text-zinc-500">/{currentStats.hard.total}</span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

          {/* Daily Goal */}
          {isEditingGoal ? (
            <form onSubmit={handleGoalSubmit} className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="50"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className={`w-14 rounded-md border px-2 py-1 text-xs sm:text-sm font-mono focus:outline-none ${
                  isOrange
                    ? "border-orange-500 bg-black text-white"
                    : "border-zinc-700 bg-zinc-950 text-white focus:border-zinc-500"
                }`}
                autoFocus
              />
              <button
                type="submit"
                className={`rounded-md px-2.5 py-1 text-xs sm:text-sm font-semibold ${
                  isOrange
                    ? "bg-orange-500 text-black hover:bg-orange-400"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingGoal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200 ml-0.5"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setGoalInput(stats.dailyGoal.toString());
                setIsEditingGoal(true);
              }}
              title="Click to change daily goal"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                isOrange
                  ? "border-orange-950 bg-black text-zinc-300 hover:border-orange-500/40 hover:text-orange-300"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              <Target className={`h-4 w-4 ${isOrange ? "text-orange-400" : "text-zinc-400"}`} />
              <span>Today:</span>
              <span className={`font-mono font-bold ${isOrange ? "text-orange-300" : "text-zinc-100"}`}>
                {stats.overall.solvedToday}/{stats.dailyGoal}
              </span>
            </button>
          )}

          {/* Collapse / Expand Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Show progress bar" : "Hide progress bar"}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Thin Multi-Segmented Progress Bar */}
      {!isCollapsed && (
        <div className={`border-t px-4 py-2.5 ${isOrange ? "border-orange-950/60" : "border-zinc-800/60"}`}>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-800/80">
            <div
              style={{ width: `${easyPct}%` }}
              className="bg-emerald-500 transition-all duration-300"
              title={`Easy: ${currentStats.easy.solved} solved`}
            />
            <div
              style={{ width: `${medPct}%` }}
              className="bg-amber-500 transition-all duration-300"
              title={`Medium: ${currentStats.medium.solved} solved`}
            />
            <div
              style={{ width: `${hardPct}%` }}
              className="bg-rose-500 transition-all duration-300"
              title={`Hard: ${currentStats.hard.solved} solved`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
