"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Shuffle,
  Dice5,
  Video,
  FileText,
  Check,
} from "lucide-react";
import { LeetCodeIcon } from "./LeetCodeIcon";
import { ProblemRow, SheetKey, DifficultyFilter } from "../types/sheet";
import { getDifficultyColor } from "../lib/utils";
import { ThemeMode } from "../hooks/useTheme";

interface RandomProblemModalProps {
  isOpen: boolean;
  theme?: ThemeMode;
  onClose: () => void;
  allProblems: ProblemRow[];
  isSolved: (sheet: string, problemId: string) => boolean;
  onOpenVideo: (problem: ProblemRow) => void;
  onOpenNotes: (problem: ProblemRow) => void;
  onToggleSolved: (sheet: string, problemId: string) => void;
}

export const RandomProblemModal: React.FC<RandomProblemModalProps> = ({
  isOpen,
  theme = "orange",
  onClose,
  allProblems,
  isSolved,
  onOpenVideo,
  onOpenNotes,
  onToggleSolved,
}) => {
  const [selectedSheet, setSelectedSheet] = useState<"ALL" | SheetKey>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>("ALL");
  const [unsolvedOnly, setUnsolvedOnly] = useState(true);
  const [pickedProblem, setPickedProblem] = useState<ProblemRow | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const isOrange = theme === "orange";

  const rollWithFilters = (
    sheet: "ALL" | SheetKey,
    diff: DifficultyFilter,
    unsolved: boolean
  ) => {
    setIsRolling(true);

    const candidates = allProblems.filter((p) => {
      if (sheet !== "ALL" && p.sheet !== sheet) return false;
      if (diff !== "ALL" && p.difficulty !== diff) return false;
      if (unsolved && isSolved(p.sheet, p.id)) return false;
      return true;
    });

    setTimeout(() => {
      if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        setPickedProblem(candidates[randomIndex]);
      } else {
        setPickedProblem(null);
      }
      setIsRolling(false);
    }, 150);
  };

  const rollRandom = () => {
    rollWithFilters(selectedSheet, selectedDifficulty, unsolvedOnly);
  };

  useEffect(() => {
    if (isOpen) {
      rollWithFilters(selectedSheet, selectedDifficulty, unsolvedOnly);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const diff = pickedProblem ? getDifficultyColor(pickedProblem.difficulty) : null;
  const pickedSolved = pickedProblem ? isSolved(pickedProblem.sheet, pickedProblem.id) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      <div className={`relative z-10 w-full max-w-lg overflow-hidden rounded-xl border p-5 sm:p-6 shadow-2xl ${
        isOrange ? "border-orange-950 bg-black" : "border-zinc-800 bg-zinc-950"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              isOrange ? "border-orange-500/40 bg-orange-500/10 text-orange-400" : "border-zinc-800 bg-zinc-900 text-zinc-300"
            }`}>
              <Shuffle className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Random Problem Picker</h3>
              <p className="text-xs sm:text-sm text-zinc-400">Pick a problem for your practice session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
          <div>
            <label className="text-xs font-medium text-zinc-400">Sheet</label>
            <select
              value={selectedSheet}
              onChange={(e) => {
                const sheet = e.target.value as "ALL" | SheetKey;
                setSelectedSheet(sheet);
                rollWithFilters(sheet, selectedDifficulty, unsolvedOnly);
              }}
              className={`mt-1.5 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none cursor-pointer ${
                isOrange ? "border-zinc-800 focus:border-orange-500" : "border-zinc-800 focus:border-zinc-600"
              }`}
            >
              <option value="ALL">Any Sheet</option>
              <option value="SDE">SDE Sheet</option>
              <option value="A2Z">A2Z Sheet</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                const diffVal = e.target.value as DifficultyFilter;
                setSelectedDifficulty(diffVal);
                rollWithFilters(selectedSheet, diffVal, unsolvedOnly);
              }}
              className={`mt-1.5 w-full rounded-lg border bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none cursor-pointer ${
                isOrange ? "border-zinc-800 focus:border-orange-500" : "border-zinc-800 focus:border-zinc-600"
              }`}
            >
              <option value="ALL">Any Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Unsolved checkbox */}
        <div className="mt-3.5 flex items-center gap-2.5">
          <input
            type="checkbox"
            id="unsolvedOnlyCheck"
            checked={unsolvedOnly}
            onChange={(e) => {
              const val = e.target.checked;
              setUnsolvedOnly(val);
              rollWithFilters(selectedSheet, selectedDifficulty, val);
            }}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-orange-500 focus:ring-0"
          />
          <label htmlFor="unsolvedOnlyCheck" className="text-xs sm:text-sm text-zinc-300 cursor-pointer">
            Pick from unsolved problems only
          </label>
        </div>

        {/* Selected Problem Card */}
        <div className={`mt-4 rounded-xl border p-4 sm:p-5 ${
          isOrange ? "border-orange-950/80 bg-[#0d0d10]" : "border-zinc-800 bg-zinc-900/60"
        }`}>
          {isRolling ? (
            <div className="flex flex-col items-center justify-center py-7">
              <Dice5 className={`h-7 w-7 animate-spin ${isOrange ? "text-orange-400" : "text-zinc-300"}`} />
              <span className="mt-2 text-xs sm:text-sm text-zinc-400 font-mono">Shuffling...</span>
            </div>
          ) : pickedProblem && diff ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs sm:text-sm text-zinc-400 font-medium">
                  #{String(pickedProblem.number).padStart(3, "0")} ({pickedProblem.sheet} Sheet)
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${diff.badge}`}>
                  {pickedProblem.difficulty}
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-bold text-white">{pickedProblem.problem_name}</h4>
              <p className="text-xs sm:text-sm text-zinc-400">
                {pickedProblem.section_name}
                {pickedProblem.subtopic_name && ` • ${pickedProblem.subtopic_name}`}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                {pickedProblem.external_practice_url && (
                  <a
                    href={pickedProblem.external_practice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                      isOrange
                        ? "bg-orange-500 text-black hover:bg-orange-400 shadow-sm"
                        : "bg-zinc-100 text-zinc-950 hover:bg-white"
                    }`}
                  >
                    <LeetCodeIcon className="h-4 w-4" monochrome={true} />
                    <span>Practice on {pickedProblem.platform || "LeetCode"}</span>
                  </a>
                )}

                {pickedProblem.youtube_url && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenVideo(pickedProblem);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:bg-zinc-850 hover:text-white transition-colors"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>Video</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onOpenNotes(pickedProblem);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:bg-zinc-850 hover:text-white transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Notes</span>
                </button>

                <button
                  onClick={() => onToggleSolved(pickedProblem.sheet, pickedProblem.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                    pickedSolved
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{pickedSolved ? "Solved" : "Mark Done"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-7 text-center text-xs sm:text-sm text-zinc-400">
              No matching problems found with the chosen filters.
            </div>
          )}
        </div>

        {/* Modal Footer: Re-roll button */}
        <div className="mt-5 flex items-center justify-between border-t border-zinc-850 pt-3.5 text-xs sm:text-sm">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Close
          </button>

          <button
            onClick={rollRandom}
            disabled={isRolling}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 font-bold transition-all disabled:opacity-40 ${
              isOrange
                ? "bg-orange-500 text-black hover:bg-orange-400"
                : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            }`}
          >
            <Dice5 className="h-4 w-4" />
            <span>Roll Another</span>
          </button>
        </div>
      </div>
    </div>
  );
};
