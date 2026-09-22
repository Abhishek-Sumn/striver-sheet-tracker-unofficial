"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Check,
  Star,
  Video,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { LeetCodeIcon } from "./LeetCodeIcon";
import { ProblemRow } from "../types/sheet";
import { ConfidenceRating } from "../lib/storage/types";
import { cn, getDifficultyColor } from "../lib/utils";
import { ThemeMode } from "../hooks/useTheme";

interface ProblemTableViewProps {
  problems: ProblemRow[];
  theme?: ThemeMode;
  isSolved: (sheet: string, problemId: string) => boolean;
  isBookmarked: (sheet: string, problemId: string) => boolean;
  getNotes: (sheet: string, problemId: string) => string;
  getConfidence: (sheet: string, problemId: string) => ConfidenceRating | undefined;
  onToggleSolved: (sheet: string, problemId: string) => void;
  onToggleBookmarked: (sheet: string, problemId: string) => void;
  onOpenVideo: (problem: ProblemRow) => void;
  onOpenNotes: (problem: ProblemRow) => void;
  onSetConfidence: (
    sheet: string,
    problemId: string,
    confidence: ConfidenceRating | null
  ) => void;
}

type SortColumn =
  | "status"
  | "number"
  | "name"
  | "difficulty"
  | "section"
  | "platform"
  | "confidence";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 50;

const difficultyRank: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

const confidenceRank: Record<string, number> = {
  easy: 3,
  medium: 2,
  hard: 1,
};

export const ProblemTableView: React.FC<ProblemTableViewProps> = ({
  problems,
  theme = "orange",
  isSolved,
  isBookmarked,
  getNotes,
  getConfidence,
  onToggleSolved,
  onToggleBookmarked,
  onOpenVideo,
  onOpenNotes,
  onSetConfidence,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const isOrange = theme === "orange";

  useEffect(() => {
    setCurrentPage(1);
  }, [problems.length]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const sortedProblems = useMemo(() => {
    if (!sortColumn) return problems;

    return [...problems].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case "status": {
          const aSolved = isSolved(a.sheet, a.id) ? 1 : 0;
          const bSolved = isSolved(b.sheet, b.id) ? 1 : 0;
          comparison = aSolved - bSolved;
          break;
        }
        case "number": {
          comparison = a.number - b.number;
          break;
        }
        case "name": {
          comparison = a.problem_name.localeCompare(b.problem_name);
          break;
        }
        case "difficulty": {
          const aDiff = difficultyRank[a.difficulty] || 0;
          const bDiff = difficultyRank[b.difficulty] || 0;
          comparison = aDiff - bDiff;
          break;
        }
        case "section": {
          comparison = a.section_name.localeCompare(b.section_name);
          break;
        }
        case "platform": {
          comparison = a.platform.localeCompare(b.platform);
          break;
        }
        case "confidence": {
          const aConf = getConfidence(a.sheet, a.id);
          const bConf = getConfidence(b.sheet, b.id);
          const aVal = aConf ? confidenceRank[aConf] : 0;
          const bVal = bConf ? confidenceRank[bConf] : 0;
          comparison = aVal - bVal;
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [problems, sortColumn, sortDirection, isSolved, getConfidence]);

  const totalPages = Math.max(1, Math.ceil(sortedProblems.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginated = sortedProblems.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const renderSortIndicator = (col: SortColumn) => {
    if (sortColumn !== col) {
      return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-zinc-500" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-3.5 w-3.5 text-orange-400 font-bold" />
    ) : (
      <ChevronDown className="ml-1 h-3.5 w-3.5 text-orange-400 font-bold" />
    );
  };

  const handleCycleConfidence = (sheet: string, problemId: string) => {
    const current = getConfidence(sheet, problemId);
    const nextMap: Record<string, ConfidenceRating | null> = {
      easy: "medium",
      medium: "hard",
      hard: null,
    };
    const next = current ? nextMap[current] : "easy";
    onSetConfidence(sheet, problemId, next);
  };

  return (
    <div className={`overflow-hidden rounded-xl border transition-colors ${
      isOrange
        ? "border-orange-950/60 bg-zinc-950/90 shadow-sm"
        : "border-zinc-800 bg-zinc-900/30"
    }`}>
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className={`border-b text-xs font-mono uppercase text-zinc-400 ${
            isOrange ? "border-orange-950/80 bg-black" : "border-zinc-800 bg-zinc-950/80"
          }`}>
            <tr>
              {/* Status Header */}
              <th className="w-12 px-3.5 py-3 text-center">
                <button
                  onClick={() => handleSort("status")}
                  className="inline-flex items-center hover:text-zinc-200 transition-colors"
                  title="Sort by Solved Status"
                >
                  <span className="font-bold">✓</span>
                  {renderSortIndicator("status")}
                </button>
              </th>

              {/* ID Header */}
              <th className="w-20 px-3.5 py-3">
                <button
                  onClick={() => handleSort("number")}
                  className="inline-flex items-center hover:text-zinc-200 transition-colors"
                  title="Sort by Problem ID"
                >
                  <span>#ID</span>
                  {renderSortIndicator("number")}
                </button>
              </th>

              {/* Problem Name Header */}
              <th className="px-3.5 py-3">
                <button
                  onClick={() => handleSort("name")}
                  className="inline-flex items-center hover:text-zinc-200 transition-colors"
                  title="Sort by Problem Name"
                >
                  <span>Problem Name</span>
                  {renderSortIndicator("name")}
                </button>
              </th>

              {/* Difficulty Header */}
              <th className="w-28 px-3.5 py-3">
                <button
                  onClick={() => handleSort("difficulty")}
                  className="inline-flex items-center hover:text-zinc-200 transition-colors"
                  title="Sort by Difficulty"
                >
                  <span>Difficulty</span>
                  {renderSortIndicator("difficulty")}
                </button>
              </th>

              {/* Section Header */}
              <th className="hidden w-44 px-3.5 py-3 md:table-cell">
                <button
                  onClick={() => handleSort("section")}
                  className="inline-flex items-center hover:text-zinc-200 transition-colors"
                  title="Sort by Section Name"
                >
                  <span>Section</span>
                  {renderSortIndicator("section")}
                </button>
              </th>

              {/* Platform Header */}
              <th className="hidden w-32 px-3.5 py-3 sm:table-cell">
                <button
                  onClick={() => handleSort("platform")}
                  className="inline-flex items-center hover:text-zinc-200 transition-colors"
                  title="Sort by Platform"
                >
                  <span>Platform</span>
                  {renderSortIndicator("platform")}
                </button>
              </th>

              {/* Confidence / Mastery Header */}
              <th className="w-32 px-3.5 py-3">
                <button
                  onClick={() => handleSort("confidence")}
                  className="inline-flex items-center hover:text-zinc-200 transition-colors"
                  title="Sort by Mastery"
                >
                  <span>Mastery</span>
                  {renderSortIndicator("confidence")}
                </button>
              </th>

              {/* Actions Header */}
              <th className="w-28 px-3.5 py-3 text-right font-sans">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850/60">
            {paginated.map((problem) => {
              const solved = isSolved(problem.sheet, problem.id);
              const bookmarked = isBookmarked(problem.sheet, problem.id);
              const hasNotes = getNotes(problem.sheet, problem.id).trim().length > 0;
              const confidence = getConfidence(problem.sheet, problem.id);
              const diff = getDifficultyColor(problem.difficulty);
              const practiceLink = problem.practice_url || problem.external_practice_url;

              return (
                <tr
                  key={`${problem.sheet}:${problem.id}`}
                  className={cn(
                    "transition-colors",
                    solved
                      ? "bg-black/60 text-zinc-500"
                      : isOrange
                      ? "hover:bg-[#121215]"
                      : "hover:bg-zinc-850/50"
                  )}
                >
                  {/* Status Checkbox */}
                  <td className="px-3.5 py-2.5 text-center">
                    <button
                      onClick={() => onToggleSolved(problem.sheet, problem.id)}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border transition-colors mx-auto",
                        solved
                          ? "border-emerald-500 bg-emerald-500 text-black shadow-sm"
                          : "border-zinc-700 bg-black hover:border-zinc-500"
                      )}
                    >
                      {solved && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>
                  </td>

                  {/* ID */}
                  <td className="px-3.5 py-2.5 font-mono text-sm text-zinc-400">
                    <span className="font-semibold text-zinc-300">#{String(problem.number).padStart(3, "0")}</span>
                  </td>

                  {/* Problem Name & star */}
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() =>
                          onToggleBookmarked(problem.sheet, problem.id)
                        }
                        className="text-zinc-600 hover:text-amber-400 transition-colors"
                        title={bookmarked ? "Bookmarked for revision" : "Bookmark problem"}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            bookmarked && "fill-amber-400 text-amber-400"
                          )}
                        />
                      </button>
                      {practiceLink ? (
                        <a
                          href={practiceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "font-medium text-[15px] transition-colors hover:underline underline-offset-2",
                            solved
                              ? "text-zinc-500 line-through decoration-zinc-700"
                              : isOrange
                              ? "text-zinc-100 hover:text-orange-400"
                              : "text-zinc-100 hover:text-white"
                          )}
                        >
                          {problem.problem_name}
                        </a>
                      ) : (
                        <span
                          className={cn(
                            "font-medium text-[15px]",
                            solved ? "text-zinc-500 line-through" : "text-zinc-100"
                          )}
                        >
                          {problem.problem_name}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Difficulty */}
                  <td className="px-3.5 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
                        diff.badge
                      )}
                    >
                      {problem.difficulty}
                    </span>
                  </td>

                  {/* Section */}
                  <td className="hidden px-3.5 py-2.5 text-sm text-zinc-400 md:table-cell truncate max-w-[190px]">
                    {problem.section_name}
                  </td>

                  {/* Platform */}
                  <td className="hidden px-3.5 py-2.5 sm:table-cell">
                    <span className="text-zinc-400 font-mono text-xs">
                      {problem.platform}
                    </span>
                  </td>

                  {/* Confidence / Mastery Column */}
                  <td className="px-3.5 py-2.5">
                    {confidence ? (
                      <button
                        onClick={() => handleCycleConfidence(problem.sheet, problem.id)}
                        title="Click to cycle mastery"
                        className={cn(
                          "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium font-mono transition-colors",
                          confidence === "easy" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
                          confidence === "medium" && "border-amber-500/20 bg-amber-500/10 text-amber-400",
                          confidence === "hard" && "border-rose-500/20 bg-rose-500/10 text-rose-400"
                        )}
                      >
                        {confidence === "easy" && "Confident"}
                        {confidence === "medium" && "Practice"}
                        {confidence === "hard" && "Revisit"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCycleConfidence(problem.sheet, problem.id)}
                        title="Rate your mastery"
                        className="inline-flex items-center rounded border border-dashed border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        + Rate
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3.5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {problem.youtube_url && (
                        <button
                          onClick={() => onOpenVideo(problem)}
                          title="Watch video solution"
                          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                        >
                          <Video className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenNotes(problem)}
                        title="Problem notes"
                        className={cn(
                          "relative rounded p-1.5 transition-colors",
                          hasNotes
                            ? "text-emerald-400 hover:bg-zinc-800 hover:text-emerald-300"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                        )}
                      >
                        <FileText className="h-4 w-4" />
                        {hasNotes && (
                          <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>

                      {practiceLink && (
                        <a
                          href={practiceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Practice on ${problem.platform || "LeetCode"}`}
                          className="rounded p-1.5 inline-flex items-center justify-center hover:bg-zinc-800 transition-all hover:scale-110 active:scale-95"
                        >
                          <LeetCodeIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between border-t px-4 py-3 text-sm text-zinc-400 ${
          isOrange ? "border-orange-950/80 bg-black" : "border-zinc-800 bg-zinc-950/60"
        }`}>
          <div className="font-mono text-zinc-400">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sortedProblems.length)} of {sortedProblems.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs sm:text-sm transition-colors disabled:opacity-30 ${
                isOrange
                  ? "border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
                  : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>
            <span className="px-2 font-mono text-sm text-zinc-200 font-semibold">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs sm:text-sm transition-colors disabled:opacity-30 ${
                isOrange
                  ? "border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
                  : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
