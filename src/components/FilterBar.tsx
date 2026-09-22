"use client";

import React from "react";
import {
  Search,
  X,
  Video,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import {
  FilterState,
  DifficultyFilter,
  StatusFilter,
  PlatformFilter,
} from "../types/sheet";
import { ThemeMode } from "../hooks/useTheme";

interface FilterBarProps {
  filters: FilterState;
  theme?: ThemeMode;
  onChangeFilters: (updated: Partial<FilterState>) => void;
  onResetFilters: () => void;
  matchCount: number;
  totalCount: number;
  countsBySheet: {
    all: number;
    sde: number;
    a2z: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  theme = "orange",
  onChangeFilters,
  onResetFilters,
  matchCount,
  totalCount,
}) => {
  const isFiltered =
    filters.searchQuery.trim() !== "" ||
    filters.difficulty !== "ALL" ||
    filters.status !== "ALL" ||
    filters.platform !== "ALL" ||
    filters.hasVideoOnly ||
    filters.sheet !== "ALL";

  const isOrange = theme === "orange";

  return (
    <div className="space-y-3">
      {/* Top Controls Row */}
      <div className={`flex flex-col gap-3 rounded-xl border p-3 sm:p-4 transition-colors ${
        isOrange
          ? "border-orange-950/60 bg-zinc-950/90 shadow-sm"
          : "border-zinc-800 bg-zinc-900/40"
      }`}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
          {/* Search bar */}
          <div className="relative sm:col-span-2 lg:col-span-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search problems, #ID, or topics... (/ to focus)"
              value={filters.searchQuery}
              onChange={(e) => onChangeFilters({ searchQuery: e.target.value })}
              className={`w-full rounded-lg border bg-black py-2 pl-9 pr-8 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                isOrange
                  ? "border-zinc-800 focus:border-orange-500 focus:ring-orange-500/40"
                  : "border-zinc-800 focus:border-zinc-600 focus:ring-zinc-600"
              }`}
            />
            {filters.searchQuery ? (
              <button
                onClick={() => onChangeFilters({ searchQuery: "" })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-zinc-400">
                /
              </kbd>
            )}
          </div>

          {/* Status filter dropdown */}
          <div className="lg:col-span-2">
            <select
              value={filters.status}
              onChange={(e) => onChangeFilters({ status: e.target.value as StatusFilter })}
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-zinc-200 focus:outline-none cursor-pointer ${
                isOrange ? "border-zinc-800 focus:border-orange-500" : "border-zinc-800 focus:border-zinc-600"
              }`}
            >
              <option value="ALL">All Statuses</option>
              <option value="solved">✓ Solved Only</option>
              <option value="unsolved">○ Unsolved Only</option>
              <option value="bookmarked">★ Bookmarked</option>
              <option value="has_notes">📝 Has Notes</option>
              <option value="confidence_hard">🔴 Revisit Soon</option>
              <option value="confidence_medium">🟡 Practice</option>
              <option value="confidence_easy">🟢 Confident</option>
            </select>
          </div>

          {/* Difficulty filter dropdown */}
          <div className="lg:col-span-2">
            <select
              value={filters.difficulty}
              onChange={(e) =>
                onChangeFilters({ difficulty: e.target.value as DifficultyFilter })
              }
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-zinc-200 focus:outline-none cursor-pointer ${
                isOrange ? "border-zinc-800 focus:border-orange-500" : "border-zinc-800 focus:border-zinc-600"
              }`}
            >
              <option value="ALL">All Difficulties</option>
              <option value="Easy">🟢 Easy</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Hard">🔴 Hard</option>
            </select>
          </div>

          {/* Platform filter dropdown */}
          <div className="lg:col-span-2">
            <select
              value={filters.platform}
              onChange={(e) =>
                onChangeFilters({ platform: e.target.value as PlatformFilter })
              }
              className={`w-full rounded-lg border bg-black px-3 py-2 text-sm text-zinc-200 focus:outline-none cursor-pointer ${
                isOrange ? "border-zinc-800 focus:border-orange-500" : "border-zinc-800 focus:border-zinc-600"
              }`}
            >
              <option value="ALL">All Platforms</option>
              <option value="LeetCode">LeetCode</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Video Toggle & View Switcher */}
          <div className="flex items-center gap-2 lg:col-span-2 justify-end">
            <button
              onClick={() => onChangeFilters({ hasVideoOnly: !filters.hasVideoOnly })}
              title="Filter by problems with video explanations"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                filters.hasVideoOnly
                  ? isOrange
                    ? "border-orange-500/60 bg-orange-500/20 text-orange-300"
                    : "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-zinc-800 bg-black text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Video className="h-4 w-4" />
              <span>Video</span>
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg border border-zinc-800 bg-black p-0.5">
              <button
                onClick={() => onChangeFilters({ viewMode: "accordion" })}
                title="Group by topic"
                className={`rounded-md p-1.5 transition-colors ${
                  filters.viewMode === "accordion"
                    ? isOrange ? "bg-orange-500 text-black font-bold" : "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => onChangeFilters({ viewMode: "table" })}
                title="Dense table view"
                className={`rounded-md p-1.5 transition-colors ${
                  filters.viewMode === "table"
                    ? isOrange ? "bg-orange-500 text-black font-bold" : "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </div>

            {isFiltered && (
              <button
                onClick={onResetFilters}
                title="Reset all filters"
                className="rounded-lg border border-zinc-800 bg-black px-2.5 py-2 text-sm text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Chips + Results counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-850 pt-2.5 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-400 font-medium">Quick Filters:</span>
            <button
              onClick={() =>
                onChangeFilters({
                  status: filters.status === "unsolved" ? "ALL" : "unsolved",
                })
              }
              className={`rounded-md px-2.5 py-1 transition-colors font-medium text-xs sm:text-sm ${
                filters.status === "unsolved"
                  ? isOrange ? "bg-orange-500 text-black font-bold" : "bg-zinc-700 text-zinc-100"
                  : "bg-black text-zinc-400 border border-zinc-800 hover:text-zinc-200"
              }`}
            >
              ○ Unsolved
            </button>
            <button
              onClick={() =>
                onChangeFilters({
                  status: filters.status === "bookmarked" ? "ALL" : "bookmarked",
                })
              }
              className={`rounded-md px-2.5 py-1 transition-colors font-medium text-xs sm:text-sm ${
                filters.status === "bookmarked"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-black text-zinc-400 border border-zinc-800 hover:text-zinc-200"
              }`}
            >
              ★ Bookmarks
            </button>
            <button
              onClick={() =>
                onChangeFilters({
                  status: filters.status === "has_notes" ? "ALL" : "has_notes",
                })
              }
              className={`rounded-md px-2.5 py-1 transition-colors font-medium text-xs sm:text-sm ${
                filters.status === "has_notes"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-black text-zinc-400 border border-zinc-800 hover:text-zinc-200"
              }`}
            >
              📝 Notes
            </button>
            <button
              onClick={() =>
                onChangeFilters({
                  status: filters.status === "confidence_hard" ? "ALL" : "confidence_hard",
                })
              }
              className={`rounded-md px-2.5 py-1 transition-colors font-medium text-xs sm:text-sm ${
                filters.status === "confidence_hard"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-black text-zinc-400 border border-zinc-800 hover:text-zinc-200"
              }`}
            >
              🔴 Revisit Soon
            </button>
          </div>

          <div className="font-mono text-zinc-400 text-xs sm:text-sm">
            Showing <span className="text-white font-bold">{matchCount}</span> of {totalCount}
          </div>
        </div>
      </div>
    </div>
  );
};
