"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Check,
  Star,
  Play,
  FileText,
  PlusCircle,
} from "lucide-react";
import { LeetCodeIcon } from "./LeetCodeIcon";
import { ProblemRow, SheetKey } from "../types/sheet";
import { ConfidenceRating, LastActiveProblem } from "../lib/storage/types";
import { isAllowedPracticeUrl, isAllowedArticleUrl } from "../lib/utils";

interface DSASectionAccordionProps {
  problems: ProblemRow[];
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
  lastActiveProblem?: LastActiveProblem | null;
  lastOpenedSection?: string | null;
  onSelectProblem?: (problem: ProblemRow) => void;
  onOpenSectionChange?: (sectionKey: string | null) => void;
}

export const DSASectionAccordion: React.FC<DSASectionAccordionProps> = ({
  problems,
  isSolved,
  isBookmarked,
  getNotes,
  onToggleSolved,
  onToggleBookmarked,
  onOpenVideo,
  onOpenNotes,
  lastActiveProblem,
  lastOpenedSection,
  onSelectProblem,
  onOpenSectionChange,
}) => {
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

    const sheetPriority: Record<string, number> = { A2Z: 1, SDE: 2 };

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

  // Helper to read initial active target synchronously from storage to prevent layout shift
  const getInitialActiveTarget = () => {
    if (typeof window === "undefined") return { secKey: null, subKey: null };
    try {
      const raw = localStorage.getItem("dsa_tracker_progress_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lastActiveProblem?.sheet && parsed.lastActiveProblem?.sectionName) {
          const secKey = `${parsed.lastActiveProblem.sheet}::${parsed.lastActiveProblem.sectionName}`;
          const subKey = `${secKey}::${parsed.lastActiveProblem.subtopicName || parsed.lastActiveProblem.sectionName}`;
          return { secKey, subKey };
        }
        if (parsed.lastOpenedSection) {
          return { secKey: parsed.lastOpenedSection, subKey: null };
        }
      }
    } catch {}
    return { secKey: null, subKey: null };
  };

  // Section open state initialized immediately to eliminate delay and layout pop-in
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const { secKey } = getInitialActiveTarget();
    return secKey ? { [secKey]: true } : {};
  });

  // Subtopic open state initialized immediately
  const [openSubtopics, setOpenSubtopics] = useState<Record<string, boolean>>(() => {
    const { subKey } = getInitialActiveTarget();
    return subKey ? { [subKey]: true } : {};
  });

  const isInitializedRef = useRef(false);
  const hasScrolledRef = useRef(false);

  // Fallback sync if props update after initial mount
  useEffect(() => {
    if (isInitializedRef.current) return;

    let targetSecKey: string | null = null;
    let targetSubKey: string | null = null;

    if (lastActiveProblem) {
      targetSecKey = `${lastActiveProblem.sheet}::${lastActiveProblem.sectionName}`;
      targetSubKey = `${targetSecKey}::${lastActiveProblem.subtopicName || lastActiveProblem.sectionName}`;
    } else if (lastOpenedSection) {
      targetSecKey = lastOpenedSection;
    }

    if (targetSecKey) {
      isInitializedRef.current = true;
      setOpenSections((prev) => (prev[targetSecKey!] ? prev : { [targetSecKey!]: true }));
      if (targetSubKey) {
        setOpenSubtopics((prev) => (prev[targetSubKey!] ? prev : { [targetSubKey!]: true }));
      }
    }
  }, [lastActiveProblem, lastOpenedSection]);

  // Instant scroll on load: place the active section at top of screen (mid to top)
  useEffect(() => {
    if (hasScrolledRef.current) return;

    let targetSecKey: string | null = null;
    let targetProblemId: string | null = null;
    let targetSheet: string | null = null;

    if (lastActiveProblem) {
      targetSecKey = `${lastActiveProblem.sheet}::${lastActiveProblem.sectionName}`;
      targetProblemId = lastActiveProblem.problemId;
      targetSheet = lastActiveProblem.sheet;
    } else if (lastOpenedSection) {
      targetSecKey = lastOpenedSection;
    } else {
      const { secKey } = getInitialActiveTarget();
      targetSecKey = secKey;
    }

    if (!targetSecKey && !targetProblemId) return;

    const frame = requestAnimationFrame(() => {
      // Find the section element and align it to top of screen
      const secEl = targetSecKey
        ? (document.querySelector(`[data-sec-key="${CSS.escape(targetSecKey)}"]`) as HTMLElement | null)
        : null;

      if (secEl) {
        secEl.scrollIntoView({ behavior: "instant", block: "start" });
        hasScrolledRef.current = true;
      } else if (targetSheet && targetProblemId) {
        const probEl = document.getElementById(`problem-${targetSheet}-${targetProblemId}`);
        if (probEl) {
          probEl.scrollIntoView({ behavior: "instant", block: "start" });
          hasScrolledRef.current = true;
        }
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [lastActiveProblem, lastOpenedSection, openSections, openSubtopics]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const willOpen = !prev[key];
      const updated = { ...prev, [key]: willOpen };
      if (willOpen) {
        onOpenSectionChange?.(key);
        const sec = sections.find((s) => `${s.sheet}::${s.section_name}` === key);
        if (sec && sec.subtopicList.length > 0) {
          const firstSubKey = `${key}::${sec.subtopicList[0].subtopic_name}`;
          setOpenSubtopics((sPrev) => ({
            ...sPrev,
            [firstSubKey]: true,
          }));
        }
      } else {
        if (lastOpenedSection === key) {
          onOpenSectionChange?.(null);
        }
      }
      return updated;
    });
  };

  const toggleSubtopic = (subKey: string) => {
    setOpenSubtopics((prev) => ({
      ...prev,
      [subKey]: !prev[subKey],
    }));
  };

  if (sections.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-zinc-500">
        No problems found matching your filters.
      </div>
    );
  }

  return (
    <div className="border-t border-[#1f2026] divide-y divide-[#1f2026] pt-1 pb-8">
      {sections.map((section) => {
        const secKey = `${section.sheet}::${section.section_name}`;
        const isSecOpen = !!openSections[secKey];

        const total = section.allProblems.length;
        const solved = section.allProblems.filter((p) =>
          isSolved(p.sheet, p.id)
        ).length;
        const percentage = total > 0 ? (solved / total) * 100 : 0;
        const isAllSolved = total > 0 && solved === total;

        // Clean section display title: prepend Step X : if not already present
        const cleanedRawName = section.section_name.replace(/^Step\s*\d+\s*:\s*/i, "");
        const displaySectionTitle =
          section.sheet === "A2Z"
            ? `Step ${section.section_number} : ${cleanedRawName}`
            : section.section_name;

        return (
          <div
            key={secKey}
            id={`section-${section.sheet}-${section.section_number}`}
            data-sec-key={secKey}
            className="transition-colors scroll-mt-6"
          >
            {/* 1. Section Header Row matching media_1790004779665.png */}
            <div
              onClick={() => toggleSection(secKey)}
              className="flex items-center justify-between py-3.5 px-3 rounded-lg hover:bg-[#151518] transition-colors cursor-pointer select-none group"
            >
              {/* Left: Chevron + Section Title */}
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <span className="text-zinc-400 group-hover:text-white transition-colors">
                  {isSecOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
                <h3 className="truncate text-base sm:text-lg font-bold text-zinc-100 group-hover:text-white transition-colors">
                  {displaySectionTitle}
                </h3>
              </div>

              {/* Right: Progress bar + Solved count (e.g. 0 / 31) */}
              <div className="flex items-center gap-3.5 flex-shrink-0">
                <div className="w-32 sm:w-44 h-1.5 rounded-full bg-[#23242b] overflow-hidden">
                  <div
                    style={{ width: `${percentage}%` }}
                    className={`h-full transition-all duration-300 ${
                      isAllSolved ? "bg-[#10b981]" : "bg-[#ff6b00]"
                    }`}
                  />
                </div>
                <span className="font-mono text-xs sm:text-sm text-zinc-400 w-14 text-right">
                  {solved} / {total}
                </span>
              </div>
            </div>

            {/* 2. Expanded Section Content: List of Subtopics */}
            {isSecOpen && (
              <div className="space-y-2 mt-1 mb-3">
                {section.subtopicList.map((subtopic) => {
                  const subKey = `${secKey}::${subtopic.subtopic_name}`;
                  const isSubOpen = !!openSubtopics[subKey];

                  const subTotal = subtopic.problems.length;
                  const subSolved = subtopic.problems.filter((p) =>
                    isSolved(p.sheet, p.id)
                  ).length;
                  const subPercentage = subTotal > 0 ? (subSolved / subTotal) * 100 : 0;
                  const isSubAllSolved = subTotal > 0 && subSolved === subTotal;

                  // Determine if subtopic header is needed
                  const isSingleSubtopicMatch =
                    section.subtopicList.length === 1 &&
                    subtopic.subtopic_name === section.section_name;

                  return (
                    <div key={subKey} className="space-y-1.5">
                      {/* Subtopic Header Row */}
                      {!isSingleSubtopicMatch && (
                        <div
                          onClick={() => toggleSubtopic(subKey)}
                          className="flex items-center justify-between py-2 px-3 pl-5 sm:pl-7 rounded-lg hover:bg-[#151518] transition-colors cursor-pointer select-none group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-4">
                            <span className="text-zinc-400 group-hover:text-white transition-colors">
                              {isSubOpen ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <span className="truncate text-sm sm:text-base font-semibold text-zinc-200 group-hover:text-white transition-colors">
                              {subtopic.subtopic_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-3.5 flex-shrink-0">
                            <div className="w-24 sm:w-36 h-1.5 rounded-full bg-[#23242b] overflow-hidden">
                              <div
                                style={{ width: `${subPercentage}%` }}
                                className={`h-full transition-all duration-300 ${
                                  isSubAllSolved ? "bg-[#10b981]" : "bg-[#ff6b00]"
                                }`}
                              />
                            </div>
                            <span className="font-mono text-xs text-zinc-400 w-12 text-right">
                              {subSolved} / {subTotal}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Clean Problem Table (No Plus or Resource Plus columns) */}
                      {(isSubOpen || isSingleSubtopicMatch) && (
                        <div className="ml-3 sm:ml-7 mr-1 sm:mr-3 overflow-x-auto rounded-xl border border-[#23242b] bg-[#111215] shadow-lg">
                          <table className="w-full min-w-[700px] text-left border-collapse">
                            {/* Table Header */}
                            <thead>
                              <tr className="border-b border-[#23242b] text-xs font-semibold text-[#8e8e93] select-none">
                                <th className="py-3.5 pl-4 w-[60px] text-left">Status</th>
                                <th className="py-3.5 px-3 text-left">Problem</th>
                                <th className="py-3.5 px-2 w-[100px] text-center">Resource</th>
                                <th className="py-3.5 px-2 w-[90px] text-center">Practice</th>
                                <th className="py-3.5 px-2 w-[60px] text-center">Note</th>
                                <th className="py-3.5 px-2 w-[70px] text-center">Revision</th>
                                <th className="py-3.5 pr-4 w-[100px] text-center">Difficulty</th>
                              </tr>
                            </thead>

                            {/* Table Body */}
                            <tbody className="divide-y divide-[#1b1c22]">
                              {subtopic.problems.map((problem) => {
                                const solved = isSolved(problem.sheet, problem.id);
                                const bookmarked = isBookmarked(
                                  problem.sheet,
                                  problem.id
                                );
                                const notes = getNotes(problem.sheet, problem.id);
                                const hasNotes = notes.trim().length > 0;
                                const isLastActive = Boolean(
                                  lastActiveProblem &&
                                  lastActiveProblem.sheet === problem.sheet &&
                                  lastActiveProblem.problemId === problem.id
                                );

                                const rawPractice = problem.external_practice_url || problem.practice_url;
                                const practiceUrl = isAllowedPracticeUrl(rawPractice) ? rawPractice : "";
                                const articleUrl = isAllowedArticleUrl(problem.article_url) ? problem.article_url : "";

                                return (
                                  <tr
                                    id={`problem-${problem.sheet}-${problem.id}`}
                                    key={`${problem.sheet}:${problem.id}`}
                                    onClick={() => onSelectProblem?.(problem)}
                                    className={`group transition-colors cursor-pointer ${
                                      isLastActive
                                        ? "bg-[#ff6b00]/10 border-l-2 border-l-[#ff6b00]"
                                        : solved
                                        ? "bg-black/20 hover:bg-[#16171b]"
                                        : "hover:bg-[#16171b]"
                                    }`}
                                  >
                                    {/* Column 1: Status Checkbox */}
                                    <td className="py-3.5 pl-4 text-left">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectProblem?.(problem);
                                          onToggleSolved(problem.sheet, problem.id);
                                        }}
                                        title={
                                          solved
                                            ? "Mark as Unsolved"
                                            : "Mark as Completed"
                                        }
                                        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                                          solved
                                            ? "border-[#ff6b00] bg-[#ff6b00] text-white"
                                            : "border-[#333642] bg-[#141519] hover:border-zinc-400"
                                        }`}
                                      >
                                        {solved && <Check className="h-3 w-3 stroke-[3]" />}
                                      </button>
                                    </td>

                                    {/* Column 2: Problem Name */}
                                    <td className="py-3.5 px-3 text-left">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectProblem?.(problem);
                                            if (practiceUrl) {
                                              window.open(practiceUrl, "_blank");
                                            } else if (articleUrl) {
                                              window.open(articleUrl, "_blank");
                                            } else if (problem.youtube_url) {
                                              onOpenVideo(problem);
                                            }
                                          }}
                                          className={`cursor-pointer text-sm font-semibold transition-colors ${
                                            solved
                                              ? "text-zinc-400 line-through decoration-zinc-600"
                                              : "text-zinc-100 hover:text-white"
                                          }`}
                                        >
                                          {problem.problem_name}
                                        </span>
                                        {isLastActive && (
                                          <span className="inline-flex items-center rounded bg-[#ff6b00]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#ff8533] border border-[#ff6b00]/40 shadow-sm animate-pulse">
                                            Last active
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Column 3: Resource (Document + Red YouTube) */}
                                    <td className="py-3.5 px-2 text-center">
                                      <div className="inline-flex items-center justify-center gap-2">
                                        {/* Article Document Icon */}
                                        {articleUrl ? (
                                          <a
                                            href={articleUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Read Article"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onSelectProblem?.(problem);
                                            }}
                                            className="rounded p-1 text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                                          >
                                            <FileText className="h-4 w-4" />
                                          </a>
                                        ) : (
                                          <span className="p-1 text-zinc-700">
                                            <FileText className="h-4 w-4 opacity-30" />
                                          </span>
                                        )}

                                        {/* Red YouTube Button */}
                                        {problem.youtube_url ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onSelectProblem?.(problem);
                                              onOpenVideo(problem);
                                            }}
                                            title="Watch on YouTube"
                                            className="inline-flex h-4 w-6 items-center justify-center rounded bg-[#e50914] hover:bg-[#ff0000] text-white shadow-sm transition-transform active:scale-95"
                                          >
                                            <Play className="h-2.5 w-2.5 fill-white translate-x-0.5" />
                                          </button>
                                        ) : (
                                          <span className="inline-flex h-4 w-6 items-center justify-center rounded bg-zinc-800 text-zinc-600 opacity-30">
                                            <Play className="h-2.5 w-2.5 fill-zinc-600 translate-x-0.5" />
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Column 4: Practice (LeetCode link or ---) */}
                                    <td className="py-3.5 px-2 text-center">
                                      {practiceUrl ? (
                                        <a
                                          href={practiceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title={`Practice ${problem.platform ? `on ${problem.platform}` : "on LeetCode"}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectProblem?.(problem);
                                          }}
                                          className="inline-flex items-center justify-center p-1 rounded hover:bg-zinc-800/80 transition-all hover:scale-110 active:scale-95"
                                        >
                                          <LeetCodeIcon className="h-4 w-4" />
                                        </a>
                                      ) : (
                                        <span className="text-zinc-600 text-xs font-mono">
                                          ---
                                        </span>
                                      )}
                                    </td>

                                    {/* Column 5: Note (Circle Plus ⊕) */}
                                    <td className="py-3.5 px-2 text-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectProblem?.(problem);
                                          onOpenNotes(problem);
                                        }}
                                        title={hasNotes ? "Edit Note" : "Add Note"}
                                        className={`inline-flex items-center justify-center p-1 rounded transition-colors ${
                                          hasNotes
                                            ? "text-[#ff6b00] hover:text-[#ff8533]"
                                            : "text-zinc-400 hover:text-white"
                                        }`}
                                      >
                                        <PlusCircle
                                          className={`h-4 w-4 ${
                                            hasNotes ? "stroke-[2.5]" : ""
                                          }`}
                                        />
                                      </button>
                                    </td>

                                    {/* Column 6: Revision (Star ☆) */}
                                    <td className="py-3.5 px-2 text-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectProblem?.(problem);
                                          onToggleBookmarked(
                                            problem.sheet,
                                            problem.id
                                          );
                                        }}
                                        title={
                                          bookmarked
                                            ? "Remove from Revision"
                                            : "Bookmark for Revision"
                                        }
                                        className={`inline-flex items-center justify-center p-1 rounded transition-colors ${
                                          bookmarked
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-zinc-600 hover:text-zinc-300"
                                        }`}
                                      >
                                        <Star
                                          className={`h-4 w-4 ${
                                            bookmarked ? "fill-amber-400" : ""
                                          }`}
                                        />
                                      </button>
                                    </td>

                                    {/* Column 7: Difficulty Pill Badge */}
                                    <td className="py-3.5 pr-4 text-center">
                                      <span
                                        className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold tracking-wide ${
                                          problem.difficulty === "Easy"
                                            ? "bg-[#132a1e] border border-[#1b432e] text-[#22c55e]"
                                            : problem.difficulty === "Medium"
                                            ? "bg-[#2a2113] border border-[#4a391d] text-[#f59e0b]"
                                            : "bg-[#2d1417] border border-[#4f1e24] text-[#ef4444]"
                                        }`}
                                      >
                                        {problem.difficulty}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const SheetSectionAccordion = DSASectionAccordion;
