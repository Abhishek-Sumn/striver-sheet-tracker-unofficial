"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import rawData from "../data/sheets.json";
import { SheetArchive, ProblemRow, DifficultyFilter, StatusFilter, SheetKey } from "../types/sheet";
import { useTracker } from "../hooks/useTracker";
import { DSAHeader } from "../components/DSAHeader";
import { DSAFilterBar } from "../components/DSAFilterBar";
import { DSAProgressCard } from "../components/DSAProgressCard";
import { DSASectionAccordion } from "../components/DSASectionAccordion";
import { VideoModal } from "../components/VideoModal";
import { NotesDrawer } from "../components/NotesDrawer";
import { DataBackupModal } from "../components/DataBackupModal";
import { RandomProblemModal } from "../components/RandomProblemModal";
import { triggerConfetti } from "../lib/confetti";
import { TAKEDOWN_EMAIL } from "../lib/site";

const typedArchive = rawData as unknown as SheetArchive;
const allProblems: ProblemRow[] = typedArchive.sheets.flatMap((s) => s.rows);

export default function TrackerPage() {
  const {
    stats,
    isLoaded,
    lastActiveProblem,
    lastOpenedSection,
    setLastActiveProblem,
    setLastOpenedSection,
    toggleSolved,
    toggleBookmarked,
    saveNotes,
    setConfidence,
    exportData,
    importData,
    resetAll,
    isSolved,
    isBookmarked,
    getNotes,
    getConfidence,
  } = useTracker(allProblems);

  const ACTIVE_SHEET_KEY = "dsa_tracker_active_sheet";
  const [isMounted, setIsMounted] = useState(false);
  const [activeSheet, setActiveSheet] = useState<SheetKey | "ALL">("A2Z");

  // Client-side initialization after mount to eliminate SSR hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(ACTIVE_SHEET_KEY) as SheetKey | "ALL" | null;
      if (stored && ["A2Z", "SDE", "ALL"].includes(stored)) {
        setActiveSheet(stored);
      } else if (lastActiveProblem?.sheet && ["A2Z", "SDE"].includes(lastActiveProblem.sheet)) {
        setActiveSheet(lastActiveProblem.sheet as SheetKey);
      }
    } catch {}
  }, [lastActiveProblem]);

  const handleSelectSheet = useCallback((sheet: SheetKey | "ALL") => {
    setActiveSheet(sheet);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(ACTIVE_SHEET_KEY, sheet);
      } catch (err) {
        console.error("Failed to persist active sheet:", err);
      }
    }
  }, []);

  const handleSelectProblem = useCallback(
    (p: ProblemRow) => {
      setLastActiveProblem({
        sheet: p.sheet,
        problemId: p.id,
        sectionName: p.section_name,
        subtopicName: p.subtopic_name,
        problemName: p.problem_name,
        updatedAt: new Date().toISOString(),
      });
    },
    [setLastActiveProblem]
  );

  const handleOpenSectionChange = useCallback(
    (secKey: string | null) => {
      setLastOpenedSection(secKey);
    },
    [setLastOpenedSection]
  );

  const handleResumeLast = useCallback(() => {
    if (!lastActiveProblem) return;
    if (activeSheet !== "ALL" && activeSheet !== lastActiveProblem.sheet) {
      handleSelectSheet(lastActiveProblem.sheet as SheetKey);
    }
    setStatusFilter("ALL");
    setDifficultyFilter("ALL");
    setSearchQuery("");
    setTimeout(() => {
      const secKey = `${lastActiveProblem.sheet}::${lastActiveProblem.sectionName}`;
      const secEl = document.querySelector(
        `[data-sec-key="${CSS.escape(secKey)}"]`
      ) as HTMLElement | null;
      if (secEl) {
        secEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        const el = document.getElementById(
          `problem-${lastActiveProblem.sheet}-${lastActiveProblem.problemId}`
        );
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, 50);
  }, [lastActiveProblem, activeSheet, handleSelectSheet]);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [activeVideoProblem, setActiveVideoProblem] = useState<ProblemRow | null>(null);
  const [activeNotesProblem, setActiveNotesProblem] = useState<ProblemRow | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isRandomOpen, setIsRandomOpen] = useState(false);

  // Global search keyboard shortcut ('/')
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>("input[type='text']");
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Filter problems for current sheet and active filters
  const filteredProblems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return allProblems.filter((p) => {
      // Sheet filter
      if (activeSheet !== "ALL" && p.sheet !== activeSheet) {
        return false;
      }

      // Status filter
      if (statusFilter === "solved" && !isSolved(p.sheet, p.id)) {
        return false;
      }
      if (statusFilter === "unsolved" && isSolved(p.sheet, p.id)) {
        return false;
      }
      if (statusFilter === "bookmarked" && !isBookmarked(p.sheet, p.id)) {
        return false;
      }
      if (
        statusFilter === "has_notes" &&
        getNotes(p.sheet, p.id).trim().length === 0
      ) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== "ALL" && p.difficulty !== difficultyFilter) {
        return false;
      }

      // Search Query
      if (query) {
        const cleanNum = query.replace(/^#/, "");
        const matchName = p.problem_name.toLowerCase().includes(query);
        const matchSec = p.section_name.toLowerCase().includes(query);
        const matchSub = (p.subtopic_name || "").toLowerCase().includes(query);
        const matchNum = cleanNum !== "" && p.number.toString() === cleanNum;
        if (!matchName && !matchSec && !matchSub && !matchNum) {
          return false;
        }
      }

      return true;
    });
  }, [allProblems, activeSheet, statusFilter, difficultyFilter, searchQuery, isSolved, isBookmarked, getNotes]);

  // Handle solved toggle with confetti
  const handleToggleSolved = useCallback(
    async (sheet: string, problemId: string) => {
      const willBeSolved = !isSolved(sheet, problemId);
      await toggleSolved(sheet, problemId);
      if (willBeSolved) {
        triggerConfetti();
      }
    },
    [isSolved, toggleSolved]
  );

  // Prevent SSR hydration mismatch between server pre-render and client localStorage
  if (!isMounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-[#f4f4f5] antialiased">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-4">
          <div className="space-y-2 pt-2 pb-1">
            <div className="h-7 w-72 bg-[#1a1b20] rounded-md animate-pulse" />
            <div className="h-4 w-96 max-w-full bg-[#16171b] rounded-md animate-pulse" />
          </div>
          <div className="h-32 w-full rounded-2xl border border-[#23242b] bg-[#121316] animate-pulse" />
          <div className="h-11 w-full rounded-lg border border-[#23242b] bg-[#121316] animate-pulse" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-14 w-full rounded-lg border border-[#1f2026] bg-[#141518] animate-pulse"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Active stats depending on selected sheet
  const activeStats =
    activeSheet === "SDE" ? stats.sde : activeSheet === "A2Z" ? stats.a2z : stats.overall;

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#f4f4f5] antialiased">
      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        {/* 1. Header (Title, Subtitle, Know More, Last Updated) */}
        <DSAHeader
          activeSheet={activeSheet}
          onSelectSheet={handleSelectSheet}
          streakCount={stats.streak.count}
          onOpenBackup={() => setIsBackupOpen(true)}
        />

        {/* 2. Overall Progress Card (Total Progress 0/455, Easy, Medium, Hard) */}
        <DSAProgressCard
          totalSolved={activeStats.solved}
          totalProblems={activeStats.total}
          easy={activeStats.easy}
          medium={activeStats.medium}
          hard={activeStats.hard}
        />

        {/* 3. Filter & Action Row ([ All Problems ] Revision | 🔍, Difficulty ▾, <> Pick Random, ⚡ Resume Last) */}
        <DSAFilterBar
          status={statusFilter}
          difficulty={difficultyFilter}
          searchQuery={searchQuery}
          onChangeStatus={setStatusFilter}
          onChangeDifficulty={setDifficultyFilter}
          onChangeSearch={setSearchQuery}
          onOpenRandom={() => setIsRandomOpen(true)}
          lastActiveProblem={lastActiveProblem}
          onResumeLast={handleResumeLast}
        />

        {/* 4. Section List (Clean accordion rows with › chevron, title, slim progress bar, and 0/xx count) */}
        <DSASectionAccordion
          problems={filteredProblems}
          isSolved={isSolved}
          isBookmarked={isBookmarked}
          getNotes={getNotes}
          getConfidence={getConfidence}
          onToggleSolved={handleToggleSolved}
          onToggleBookmarked={toggleBookmarked}
          onOpenVideo={(p) => setActiveVideoProblem(p)}
          onOpenNotes={(p) => setActiveNotesProblem(p)}
          onSetConfidence={setConfidence}
          lastActiveProblem={lastActiveProblem}
          lastOpenedSection={lastOpenedSection}
          onSelectProblem={handleSelectProblem}
          onOpenSectionChange={handleOpenSectionChange}
        />
      </main>

      {/* Modals & Drawers */}
      <VideoModal
        problem={activeVideoProblem}
        theme="orange"
        onClose={() => setActiveVideoProblem(null)}
      />

      <NotesDrawer
        problem={activeNotesProblem}
        theme="orange"
        initialNotes={
          activeNotesProblem
            ? getNotes(activeNotesProblem.sheet, activeNotesProblem.id)
            : ""
        }
        isBookmarked={
          activeNotesProblem
            ? isBookmarked(activeNotesProblem.sheet, activeNotesProblem.id)
            : false
        }
        confidence={
          activeNotesProblem
            ? getConfidence(activeNotesProblem.sheet, activeNotesProblem.id)
            : undefined
        }
        onSave={saveNotes}
        onToggleBookmarked={toggleBookmarked}
        onSetConfidence={setConfidence}
        onClose={() => setActiveNotesProblem(null)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900/80 py-8 text-center text-xs sm:text-sm text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-2 leading-relaxed">
          <p>
            Unofficial and not affiliated with or endorsed by Striver or takeUforward. Sheet content © Striver / takeUforward. Problems belong to their platforms (LeetCode, GeeksforGeeks). Videos belong to their creators.
          </p>
          <p>
            Takedown or correction requests:{" "}
            <a
              href={`mailto:${TAKEDOWN_EMAIL}`}
              className="text-zinc-400 hover:text-white underline underline-offset-2 transition-colors font-mono"
            >
              {TAKEDOWN_EMAIL}
            </a>
            {" "}— handled within 24 hours.
          </p>
        </div>
      </footer>

      <DataBackupModal
        isOpen={isBackupOpen}
        theme="orange"
        onClose={() => setIsBackupOpen(false)}
        onExport={exportData}
        onImport={importData}
        onReset={resetAll}
        totalSolved={stats.overall.solved}
      />

      <RandomProblemModal
        isOpen={isRandomOpen}
        theme="orange"
        onClose={() => setIsRandomOpen(false)}
        allProblems={allProblems}
        isSolved={isSolved}
        onOpenVideo={(p) => setActiveVideoProblem(p)}
        onOpenNotes={(p) => setActiveNotesProblem(p)}
        onToggleSolved={handleToggleSolved}
      />
    </div>
  );
}
