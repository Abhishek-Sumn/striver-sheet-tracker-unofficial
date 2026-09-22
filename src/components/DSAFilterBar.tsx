"use client";

import React, { useState } from "react";
import { Search, ChevronDown, X, Code2 } from "lucide-react";
import { DifficultyFilter, StatusFilter } from "../types/sheet";
import { LastActiveProblem } from "../lib/storage/types";

interface DSAFilterBarProps {
  status: StatusFilter;
  difficulty: DifficultyFilter;
  searchQuery: string;
  onChangeStatus: (status: StatusFilter) => void;
  onChangeDifficulty: (difficulty: DifficultyFilter) => void;
  onChangeSearch: (query: string) => void;
  onOpenRandom: () => void;
  lastActiveProblem?: LastActiveProblem | null;
  onResumeLast?: () => void;
}

export const DSAFilterBar: React.FC<DSAFilterBarProps> = ({
  status,
  difficulty,
  searchQuery,
  onChangeStatus,
  onChangeDifficulty,
  onChangeSearch,
  onOpenRandom,
  lastActiveProblem,
  onResumeLast,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isRevision = status === "bookmarked";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1 pb-1">
      {/* Left: [ All Problems ] Revision Switcher matching screenshot */}
      <div className="flex items-center gap-1.5 self-start">
        <button
          onClick={() => onChangeStatus("ALL")}
          className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all ${
            !isRevision
              ? "border border-zinc-400 text-white bg-transparent shadow-sm"
              : "text-zinc-400 hover:text-white bg-transparent"
          }`}
        >
          All Problems
        </button>
        <button
          onClick={() => onChangeStatus("bookmarked")}
          className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all ${
            isRevision
              ? "border border-zinc-400 text-white bg-transparent shadow-sm"
              : "text-zinc-400 hover:text-white bg-transparent"
          }`}
        >
          Revision
        </button>
      </div>

      {/* Right: [ 🔍 ] [ Difficulty ⌵ ] [ <> Pick Random ] */}
      <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
        {/* Search button / input */}
        {isSearchOpen ? (
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search problems..."
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              className="w-48 sm:w-56 rounded-lg border border-[#27272e] bg-[#141416] py-1.5 pl-8 pr-7 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              autoFocus
            />
            <button
              onClick={() => {
                onChangeSearch("");
                setIsSearchOpen(false);
              }}
              className="absolute right-2 text-zinc-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsSearchOpen(true)}
            title="Search problems"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#27272e] bg-[#141416] text-zinc-400 hover:border-zinc-600 hover:text-white transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
        )}

        {/* Difficulty dropdown matching screenshot */}
        <div className="relative">
          <select
            value={difficulty}
            onChange={(e) => onChangeDifficulty(e.target.value as DifficultyFilter)}
            className="appearance-none rounded-lg border border-[#27272e] bg-[#141416] py-1.5 pl-3.5 pr-8 text-xs sm:text-sm font-medium text-zinc-300 hover:border-zinc-600 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        </div>

        {/* Pick Random button with <> code icon matching screenshot */}
        <button
          onClick={onOpenRandom}
          className="flex items-center gap-1.5 rounded-lg border border-[#27272e] bg-[#141416] px-3.5 py-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
        >
          <Code2 className="h-4 w-4 text-zinc-400" />
          <span>Pick Random</span>
        </button>

        {/* Resume Last Problem button */}
        {lastActiveProblem && onResumeLast && (
          <button
            onClick={onResumeLast}
            title={`Resume: ${lastActiveProblem.problemName} (${lastActiveProblem.sectionName})`}
            className="flex items-center gap-1.5 rounded-lg border border-[#ff6b00]/40 bg-[#ff6b00]/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#ff8533] hover:bg-[#ff6b00]/20 hover:text-white transition-colors cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-[#ff6b00] ring-2 ring-[#ff6b00]/30" />
            <span>Resume</span>
          </button>
        )}
      </div>
    </div>
  );
};

export const SheetFilterBar = DSAFilterBar;
