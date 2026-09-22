"use client";

import React from "react";
import {
  Check,
  Star,
  Video,
  FileText,
  BookOpen,
} from "lucide-react";
import { LeetCodeIcon } from "./LeetCodeIcon";
import { ProblemRow } from "../types/sheet";
import { ConfidenceRating } from "../lib/storage/types";
import { cn, getDifficultyColor, isAllowedArticleUrl } from "../lib/utils";
import { ThemeMode } from "../hooks/useTheme";

interface ProblemCardProps {
  problem: ProblemRow;
  isSolved: boolean;
  isBookmarked: boolean;
  hasNotes: boolean;
  confidence?: ConfidenceRating;
  theme?: ThemeMode;
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

export const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  isSolved,
  isBookmarked,
  hasNotes,
  confidence,
  theme = "orange",
  onToggleSolved,
  onToggleBookmarked,
  onOpenVideo,
  onOpenNotes,
  onSetConfidence,
}) => {
  const diffColor = getDifficultyColor(problem.difficulty);
  const isOrange = theme === "orange";

  const handleNextConfidence = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMap: Record<string, ConfidenceRating | null> = {
      easy: "medium",
      medium: "hard",
      hard: null,
    };
    const next = confidence ? nextMap[confidence] : "easy";
    onSetConfidence(problem.sheet, problem.id, next);
  };

  const confidenceBadge = () => {
    if (!confidence) {
      return (
        <button
          onClick={handleNextConfidence}
          title="Rate your mastery (Confident / Practice / Revisit)"
          className="hidden opacity-0 group-hover:opacity-100 md:inline-flex items-center rounded border border-dashed border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-opacity"
        >
          + Mastery
        </button>
      );
    }
    const map = {
      easy: { text: "Confident", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
      medium: { text: "Practice", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
      hard: { text: "Revisit", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
    };
    const c = map[confidence];
    return (
      <button
        onClick={handleNextConfidence}
        title="Click to cycle mastery level"
        className={cn(
          "rounded border px-2 py-0.5 text-xs font-medium transition-colors font-mono",
          c.color
        )}
      >
        {c.text}
      </button>
    );
  };

  const practiceLink = problem.practice_url || problem.external_practice_url;

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border transition-all",
        isSolved
          ? isOrange
            ? "border-zinc-900 bg-black/60 hover:border-zinc-800"
            : "border-zinc-800/40 bg-zinc-950/30 hover:border-zinc-800"
          : isOrange
          ? "border-zinc-850/80 bg-[#0c0c0e]/90 hover:border-orange-500/50 hover:bg-[#141418]"
          : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-900/80"
      )}
    >
      {/* Left: Checkbox + ID + Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Checkbox */}
        <button
          onClick={() => onToggleSolved(problem.sheet, problem.id)}
          aria-label={isSolved ? "Mark unsolved" : "Mark solved"}
          className={cn(
            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors",
            isSolved
              ? "border-emerald-500 bg-emerald-500 text-black shadow-sm"
              : "border-zinc-700 bg-black hover:border-zinc-500"
          )}
        >
          {isSolved && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        </button>

        {/* Problem # Index */}
        <span className="font-mono text-xs sm:text-sm text-zinc-500 w-9 flex-shrink-0 font-medium">
          #{String(problem.number).padStart(3, "0")}
        </span>

        {/* Problem Title */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          {practiceLink ? (
            <a
              href={practiceLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "truncate text-[15px] sm:text-base font-medium transition-colors hover:underline underline-offset-2",
                isSolved
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
                "truncate text-[15px] sm:text-base font-medium",
                isSolved ? "text-zinc-500 line-through" : "text-zinc-100"
              )}
            >
              {problem.problem_name}
            </span>
          )}
        </div>
      </div>

      {/* Center: Difficulty + Platform + Mastery */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Difficulty Pill */}
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
            diffColor.badge
          )}
        >
          {problem.difficulty}
        </span>

        {/* Platform tag */}
        {problem.platform && problem.platform !== "No official practice link" && (
          <span className="hidden lg:inline text-xs font-mono text-zinc-400">
            {problem.platform}
          </span>
        )}

        {/* Mastery Pill */}
        {confidenceBadge()}
      </div>

      {/* Right: Actions Toolbar */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Video solution */}
        {problem.youtube_url ? (
          <button
            onClick={() => onOpenVideo(problem)}
            title="Watch video explanation"
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <Video className="h-4 w-4" />
          </button>
        ) : (
          <div className="h-7 w-7" />
        )}

        {/* Editorial article */}
        {isAllowedArticleUrl(problem.article_url) && (
          <a
            href={problem.article_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Read editorial article"
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
          </a>
        )}

        {/* Notes Editor */}
        <button
          onClick={() => onOpenNotes(problem)}
          title={hasNotes ? "Edit notes (Notes exist)" : "Add notes"}
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

        {/* Direct Practice Link */}
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

        {/* Revision Bookmark */}
        <button
          onClick={() => onToggleBookmarked(problem.sheet, problem.id)}
          title={isBookmarked ? "Remove from revision list" : "Bookmark for revision"}
          className={cn(
            "rounded p-1.5 transition-colors",
            isBookmarked
              ? "text-amber-400 hover:text-amber-300"
              : "text-zinc-600 hover:text-zinc-300"
          )}
        >
          <Star className={cn("h-4 w-4", isBookmarked && "fill-amber-400")} />
        </button>
      </div>
    </div>
  );
};
