"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Check, ChevronsUpDown } from "lucide-react";
import { ProblemRow, SheetKey } from "../types/sheet";
import { ProblemCard } from "./ProblemCard";
import { ConfidenceRating } from "../lib/storage/types";
import { cn } from "../lib/utils";
import { ThemeMode } from "../hooks/useTheme";

interface SectionAccordionProps {
  problems: ProblemRow[];
  activeSheet: "ALL" | SheetKey;
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

export const SectionAccordion: React.FC<SectionAccordionProps> = ({
  problems,
  activeSheet,
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
  const isOrange = theme === "orange";

  // Group problems by Section and Subtopic
  const sections = useMemo(() => {
    type SectionMapValue = {
      section_number: number;
      section_name: string;
      sheet: SheetKey;
      subtopics: Map<string, { subtopic_number: number; problems: ProblemRow[] }>;
    };

    const map = new Map<string, SectionMapValue>();

    for (const p of problems) {
      const secKey = `${p.sheet}::${p.section_name}`;
      if (!map.has(secKey)) {
        map.set(secKey, {
          section_number: p.section_number,
          section_name: p.section_name,
          sheet: p.sheet,
          subtopics: new Map(),
        });
      }

      const sec = map.get(secKey)!;
      const subKey = p.subtopic_name || p.section_name;
      if (!sec.subtopics.has(subKey)) {
        sec.subtopics.set(subKey, {
          subtopic_number: p.subtopic_number,
          problems: [],
        });
      }

      sec.subtopics.get(subKey)!.problems.push(p);
    }

    const sheetPriority: Record<string, number> = { SDE: 1, A2Z: 2 };

    return Array.from(map.values())
      .map((s) => ({
        ...s,
        subtopicList: Array.from(s.subtopics.entries())
          .map(([subName, sub]) => ({
            subtopic_name: subName,
            subtopic_number: sub.subtopic_number,
            problems: sub.problems.sort((pa, pb) => pa.number - pb.number),
          }))
          .sort((sa, sb) => sa.subtopic_number - sb.subtopic_number),
        allProblems: Array.from(s.subtopics.values()).flatMap((sub) => sub.problems),
      }))
      .sort((a, b) => {
        if (a.sheet !== b.sheet) {
          return (sheetPriority[a.sheet] || 99) - (sheetPriority[b.sheet] || 99);
        }
        return a.section_number - b.section_number;
      });
  }, [problems]);

  const isFiltered = problems.length < 665;

  // Track user-toggled overrides
  const [userToggled, setUserToggled] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string, currentIsOpen: boolean) => {
    setUserToggled((prev) => ({
      ...prev,
      [key]: !currentIsOpen,
    }));
  };

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {};
    sections.forEach((s) => {
      allOpen[`${s.sheet}::${s.section_name}`] = true;
    });
    setUserToggled(allOpen);
  };

  const handleCollapseAll = () => {
    const allClosed: Record<string, boolean> = {};
    sections.forEach((s) => {
      allClosed[`${s.sheet}::${s.section_name}`] = false;
    });
    setUserToggled(allClosed);
  };

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400">
          <ChevronsUpDown className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-semibold text-zinc-100">No problems found</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Try adjusting your search criteria or resetting filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Batch Expand / Collapse actions */}
      <div className="flex items-center justify-between text-xs sm:text-sm px-1">
        <span className="font-mono text-zinc-400 font-medium">
          {sections.length} {sections.length === 1 ? "Section" : "Sections"}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              isOrange
                ? "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-orange-500/50 hover:text-orange-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white"
            }`}
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              isOrange
                ? "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-orange-500/50 hover:text-orange-300"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white"
            }`}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Accordion Items List */}
      <div className="space-y-2.5">
        {sections.map((section, idx) => {
          const key = `${section.sheet}::${section.section_name}`;
          const isOpen =
            userToggled[key] !== undefined
              ? userToggled[key]
              : isFiltered
              ? true
              : idx === 0;

          const totalProblems = section.allProblems.length;
          const solvedProblems = section.allProblems.filter((p) =>
            isSolved(p.sheet, p.id)
          ).length;
          const percentage =
            totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;
          const isAllSolved = totalProblems > 0 && solvedProblems === totalProblems;

          return (
            <div
              key={key}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                isAllSolved
                  ? "border-emerald-500/30 bg-zinc-950/60"
                  : isOrange
                  ? "border-orange-950/60 bg-zinc-950/80"
                  : "border-zinc-800/80 bg-zinc-900/30"
              )}
            >
              {/* Section Header Accordion Trigger */}
              <button
                onClick={() => toggleSection(key, isOpen)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-zinc-800/30"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded font-mono text-xs sm:text-sm font-semibold",
                      isAllSolved
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isOrange
                        ? "bg-black text-orange-400 border border-orange-500/30"
                        : "bg-zinc-800 text-zinc-300"
                    )}
                  >
                    {isAllSolved ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : (
                      String(section.section_number).padStart(2, "0")
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h2 className="truncate text-base sm:text-lg font-bold text-white">
                        {section.section_name}
                      </h2>
                      {activeSheet === "ALL" && (
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider",
                            section.sheet === "SDE"
                              ? isOrange
                                ? "bg-orange-500/15 text-orange-300 border border-orange-500/30"
                                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          )}
                        >
                          {section.sheet}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Solved count & percentage */}
                  <span className="font-mono text-xs sm:text-sm text-zinc-400">
                    <strong className={isAllSolved ? "text-emerald-400 font-bold" : "text-zinc-100 font-semibold"}>
                      {solvedProblems}
                    </strong>
                    /{totalProblems} ({percentage}%)
                  </span>

                  {/* Slim Section Progress Bar */}
                  <div className="hidden sm:block w-24">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          isAllSolved ? "bg-emerald-400" : isOrange ? "bg-orange-500" : "bg-zinc-400"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className="text-zinc-400">
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </button>

              {/* Section Contents (Vertical list of rows) */}
              {isOpen && (
                <div className={`border-t p-3 sm:p-3.5 ${
                  isOrange ? "border-orange-950/60 bg-black/80" : "border-zinc-800/60 bg-zinc-950/40"
                }`}>
                  {section.subtopicList.map((subtopic) => {
                    const showSubtopicHeader =
                      section.subtopicList.length > 1 ||
                      (subtopic.subtopic_name &&
                        subtopic.subtopic_name !== section.section_name);

                    const subSolved = subtopic.problems.filter((p) =>
                      isSolved(p.sheet, p.id)
                    ).length;

                    return (
                      <div key={subtopic.subtopic_name} className="mb-4 last:mb-0">
                        {showSubtopicHeader && (
                          <div className="mb-2 flex items-center justify-between px-2 pt-1">
                            <span className="text-xs sm:text-sm font-semibold text-zinc-300">
                              {subtopic.subtopic_name}
                            </span>
                            <span className="text-xs text-zinc-400 font-mono font-medium">
                              {subSolved} / {subtopic.problems.length}
                            </span>
                          </div>
                        )}

                        {/* High-density vertical rows */}
                        <div className="space-y-1.5">
                          {subtopic.problems.map((problem) => (
                            <ProblemCard
                              key={`${problem.sheet}:${problem.id}`}
                              problem={problem}
                              theme={theme}
                              isSolved={isSolved(problem.sheet, problem.id)}
                              isBookmarked={isBookmarked(
                                problem.sheet,
                                problem.id
                              )}
                              hasNotes={getNotes(problem.sheet, problem.id).trim().length > 0}
                              confidence={getConfidence(
                                problem.sheet,
                                problem.id
                              )}
                              onToggleSolved={onToggleSolved}
                              onToggleBookmarked={onToggleBookmarked}
                              onOpenVideo={onOpenVideo}
                              onOpenNotes={onOpenNotes}
                              onSetConfidence={onSetConfidence}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
