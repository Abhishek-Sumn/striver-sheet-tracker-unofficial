"use client";

import React from "react";

interface DifficultyCounts {
  total: number;
  solved: number;
}

interface DSAProgressCardProps {
  totalSolved: number;
  totalProblems: number;
  easy: DifficultyCounts;
  medium: DifficultyCounts;
  hard: DifficultyCounts;
}

export const DSAProgressCard: React.FC<DSAProgressCardProps> = ({
  totalSolved,
  totalProblems,
  easy,
  medium,
  hard,
}) => {
  const percentage =
    totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

  const easyPercent = easy.total > 0 ? (easy.solved / easy.total) * 100 : 0;
  const mediumPercent = medium.total > 0 ? (medium.solved / medium.total) * 100 : 0;
  const hardPercent = hard.total > 0 ? (hard.solved / hard.total) * 100 : 0;

  return (
    <div className="rounded-xl border border-[#26272e] bg-[#111215] px-6 py-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-[#26272e]">
        {/* 1. Total Progress & 0% ring */}
        <div className="flex items-center justify-between pr-0 lg:pr-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-zinc-400">Total Progress</span>
            <div className="text-lg font-bold tracking-tight text-white">
              {totalSolved} / {totalProblems}
            </div>
          </div>
          <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#33353d] bg-[#15161a]">
            <span className="font-mono text-xs font-bold text-white">
              {percentage}%
            </span>
          </div>
        </div>

        {/* 2. Easy Counter & Progress Bar */}
        <div className="space-y-2 px-0 lg:px-6">
          <span className="text-xs font-semibold text-zinc-400">Easy</span>
          <div className="text-sm font-bold text-white">
            {easy.solved} / {easy.total}{" "}
            <span className="text-xs font-normal text-zinc-500">completed</span>
          </div>
          <div className="h-1 w-full rounded-full bg-[#23242b] overflow-hidden">
            <div
              style={{ width: `${easyPercent}%` }}
              className="h-full bg-[#10b981] transition-all duration-300"
            />
          </div>
        </div>

        {/* 3. Medium Counter & Progress Bar */}
        <div className="space-y-2 px-0 lg:px-6">
          <span className="text-xs font-semibold text-zinc-400">Medium</span>
          <div className="text-sm font-bold text-white">
            {medium.solved} / {medium.total}{" "}
            <span className="text-xs font-normal text-zinc-500">completed</span>
          </div>
          <div className="h-1 w-full rounded-full bg-[#23242b] overflow-hidden">
            <div
              style={{ width: `${mediumPercent}%` }}
              className="h-full bg-[#f59e0b] transition-all duration-300"
            />
          </div>
        </div>

        {/* 4. Hard Counter & Progress Bar */}
        <div className="space-y-2 pl-0 lg:pl-6">
          <span className="text-xs font-semibold text-zinc-400">Hard</span>
          <div className="text-sm font-bold text-white">
            {hard.solved} / {hard.total}{" "}
            <span className="text-xs font-normal text-zinc-500">completed</span>
          </div>
          <div className="h-1 w-full rounded-full bg-[#23242b] overflow-hidden">
            <div
              style={{ width: `${hardPercent}%` }}
              className="h-full bg-[#ef4444] transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SheetProgressCard = DSAProgressCard;
