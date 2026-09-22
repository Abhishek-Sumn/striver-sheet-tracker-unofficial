"use client";

import React, { useState } from "react";
import { SheetKey } from "../types/sheet";
import { ChevronDown, Download, Flame } from "lucide-react";

interface SheetHeaderProps {
  activeSheet: SheetKey | "ALL";
  onSelectSheet: (sheet: SheetKey | "ALL") => void;
  streakCount: number;
  onOpenBackup: () => void;
}

export const DSAHeader: React.FC<SheetHeaderProps> = ({
  activeSheet,
  onSelectSheet,
  streakCount,
  onOpenBackup,
}) => {
  const [sheetDropdownOpen, setSheetDropdownOpen] = useState(false);

  const sheetTitle =
    activeSheet === "A2Z"
      ? "Unofficial Striver A2Z Sheet Tracker"
      : activeSheet === "SDE"
      ? "Unofficial Striver SDE Sheet Tracker"
      : "Unofficial Striver Sheet Tracker (A2Z & SDE)";

  const sheetDescription =
    activeSheet === "A2Z"
      ? "Free progress tracker for Striver's A2Z DSA Sheet with LeetCode practice links."
      : activeSheet === "SDE"
      ? "Free progress tracker for Striver's SDE Sheet with LeetCode practice links."
      : "Free progress tracker for Striver's A2Z and SDE DSA Sheets.";

  return (
    <div className="space-y-1 pt-2 pb-1">
      {/* Top Title & Last Updated Badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {/* Sheet Title with dropdown switcher */}
          <div className="relative inline-flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {sheetTitle}
            </h1>
            <button
              onClick={() => setSheetDropdownOpen(!sheetDropdownOpen)}
              className="rounded p-1 text-zinc-400 hover:text-white transition-colors"
              title="Switch Sheet"
            >
              <ChevronDown className="h-5 w-5" />
            </button>

            {/* Sheet Switcher Dropdown */}
            {sheetDropdownOpen && (
              <div
                className="absolute left-0 top-full mt-1 z-30 w-72 rounded-lg border border-zinc-800 bg-[#141416] p-1.5 shadow-xl"
                onMouseLeave={() => setSheetDropdownOpen(false)}
              >
                <button
                  onClick={() => {
                    onSelectSheet("A2Z");
                    setSheetDropdownOpen(false);
                  }}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                    activeSheet === "A2Z"
                      ? "bg-[#25252a] text-white font-semibold"
                      : "text-zinc-400 hover:bg-[#1c1c1f] hover:text-white"
                  }`}
                >
                  A2Z Sheet (455 problems)
                </button>
                <button
                  onClick={() => {
                    onSelectSheet("SDE");
                    setSheetDropdownOpen(false);
                  }}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                    activeSheet === "SDE"
                      ? "bg-[#25252a] text-white font-semibold"
                      : "text-zinc-400 hover:bg-[#1c1c1f] hover:text-white"
                  }`}
                >
                  SDE Sheet (191 problems)
                </button>
                <button
                  onClick={() => {
                    onSelectSheet("ALL");
                    setSheetDropdownOpen(false);
                  }}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                    activeSheet === "ALL"
                      ? "bg-[#25252a] text-white font-semibold"
                      : "text-zinc-400 hover:bg-[#1c1c1f] hover:text-white"
                  }`}
                >
                  All Sheets Combined (646 problems)
                </button>
              </div>
            )}
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#8e8e93] leading-relaxed">
            {sheetDescription}
          </p>
        </div>

        {/* Right Badge & Quick Utilities */}
        <div className="flex items-center gap-2 self-start pt-0.5">
          {streakCount > 0 && (
            <div
              title={`${streakCount} Day Streak`}
              className="flex items-center gap-1 rounded-md border border-orange-950/80 bg-[#161619] px-2.5 py-1 text-xs text-orange-400 font-medium"
            >
              <Flame className="h-3.5 w-3.5" />
              <span>{streakCount}d</span>
            </div>
          )}

          <button
            onClick={onOpenBackup}
            title="Backup & Restore Progress"
            className="flex items-center gap-1 rounded-md border border-zinc-800 bg-[#161619] px-2.5 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const SheetHeader = DSAHeader;
