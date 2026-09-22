"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  UserProgressState,
  ConfidenceRating,
  ImportResult,
  DEFAULT_STATE,
  LastActiveProblem,
} from "../lib/storage/localStorageAdapter";
import { getStorageAdapter } from "../lib/storage";
import { ProblemRow } from "../types/sheet";
import { getLocalDateString, getLocalYesterdayString, isDateToday } from "../lib/utils";

export function useTracker(allProblems: ProblemRow[]) {
  const [progress, setProgress] = useState<UserProgressState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const adapter = useMemo(() => getStorageAdapter(), []);

  useEffect(() => {
    // Initial fetch and subscribe
    let isMounted = true;
    adapter.getState().then((initialState) => {
      if (isMounted) {
        setProgress(initialState);
        setIsLoaded(true);
      }
    });

    const unsubscribe = adapter.subscribe((updatedState) => {
      if (isMounted) {
        queueMicrotask(() => {
          if (isMounted) {
            setProgress(updatedState);
          }
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [adapter]);

  const toggleSolved = useCallback(
    async (sheet: string, problemId: string): Promise<boolean> => {
      const next = await adapter.toggleSolved(sheet, problemId);
      return next;
    },
    [adapter]
  );

  const toggleBookmarked = useCallback(
    async (sheet: string, problemId: string): Promise<boolean> => {
      const next = await adapter.toggleBookmarked(sheet, problemId);
      return next;
    },
    [adapter]
  );

  const saveNotes = useCallback(
    async (sheet: string, problemId: string, notes: string): Promise<void> => {
      await adapter.saveNotes(sheet, problemId, notes);
    },
    [adapter]
  );

  const setConfidence = useCallback(
    async (
      sheet: string,
      problemId: string,
      level: ConfidenceRating | null
    ): Promise<void> => {
      await adapter.setConfidence(sheet, problemId, level);
    },
    [adapter]
  );

  const setDailyGoal = useCallback(
    async (goal: number): Promise<void> => {
      await adapter.setDailyGoal(goal);
    },
    [adapter]
  );

  const setLastActiveProblem = useCallback(
    async (problem: LastActiveProblem | null): Promise<void> => {
      await adapter.setLastActiveProblem(problem);
    },
    [adapter]
  );

  const setLastOpenedSection = useCallback(
    async (sectionKey: string | null): Promise<void> => {
      await adapter.setLastOpenedSection(sectionKey);
    },
    [adapter]
  );

  const exportData = useCallback(async (): Promise<string> => {
    return adapter.exportData();
  }, [adapter]);

  const importData = useCallback(
    async (jsonString: string, mode?: "merge" | "replace"): Promise<ImportResult> => {
      return adapter.importData(jsonString, mode);
    },
    [adapter]
  );

  const resetAll = useCallback(async (): Promise<void> => {
    await adapter.resetAll();
  }, [adapter]);

  const isSolved = useCallback(
    (sheet: string, problemId: string): boolean => {
      return Boolean(progress.solved[`${sheet}:${problemId}`]);
    },
    [progress.solved]
  );

  const isBookmarked = useCallback(
    (sheet: string, problemId: string): boolean => {
      return Boolean(progress.bookmarked[`${sheet}:${problemId}`]);
    },
    [progress.bookmarked]
  );

  const getNotes = useCallback(
    (sheet: string, problemId: string): string => {
      return progress.notes[`${sheet}:${problemId}`] || "";
    },
    [progress.notes]
  );

  const getConfidence = useCallback(
    (sheet: string, problemId: string): ConfidenceRating | undefined => {
      return progress.confidence[`${sheet}:${problemId}`];
    },
    [progress.confidence]
  );

  // Compute live statistics
  const stats = useMemo(() => {
    const today = getLocalDateString();
    const yesterday = getLocalYesterdayString();
    const isStreakActive =
      progress.streak.lastActiveDate === today ||
      progress.streak.lastActiveDate === yesterday;

    const activeStreak = {
      count: isStreakActive ? progress.streak.count : 0,
      lastActiveDate: progress.streak.lastActiveDate,
    };

    const calculateForProblems = (problems: ProblemRow[]) => {
      let solvedCount = 0;
      let bookmarkedCount = 0;
      let easyTotal = 0;
      let easySolved = 0;
      let mediumTotal = 0;
      let mediumSolved = 0;
      let hardTotal = 0;
      let hardSolved = 0;
      let solvedToday = 0;

      for (const p of problems) {
        const key = `${p.sheet}:${p.id}`;
        const solved = Boolean(progress.solved[key]);
        const bookmarked = Boolean(progress.bookmarked[key]);
        const completedIso = progress.completedAt[key];

        if (solved) {
          solvedCount++;
          if (isDateToday(completedIso)) {
            solvedToday++;
          }
        }
        if (bookmarked) {
          bookmarkedCount++;
        }

        if (p.difficulty === "Easy") {
          easyTotal++;
          if (solved) easySolved++;
        } else if (p.difficulty === "Medium") {
          mediumTotal++;
          if (solved) mediumSolved++;
        } else if (p.difficulty === "Hard") {
          hardTotal++;
          if (solved) hardSolved++;
        }
      }

      return {
        total: problems.length,
        solved: solvedCount,
        percentage: problems.length > 0 ? Math.round((solvedCount / problems.length) * 100) : 0,
        bookmarked: bookmarkedCount,
        solvedToday,
        easy: { total: easyTotal, solved: easySolved },
        medium: { total: mediumTotal, solved: mediumSolved },
        hard: { total: hardTotal, solved: hardSolved },
      };
    };

    const sdeProblems = allProblems.filter((p) => p.sheet === "SDE");
    const a2zProblems = allProblems.filter((p) => p.sheet === "A2Z");

    return {
      overall: calculateForProblems(allProblems),
      sde: calculateForProblems(sdeProblems),
      a2z: calculateForProblems(a2zProblems),
      streak: activeStreak,
      dailyGoal: progress.dailyGoal,
    };
  }, [allProblems, progress]);

  return {
    progress,
    isLoaded,
    stats,
    lastActiveProblem: progress.lastActiveProblem || null,
    lastOpenedSection: progress.lastOpenedSection || null,
    setLastActiveProblem,
    setLastOpenedSection,
    toggleSolved,
    toggleBookmarked,
    saveNotes,
    setConfidence,
    setDailyGoal,
    exportData,
    importData,
    resetAll,
    isSolved,
    isBookmarked,
    getNotes,
    getConfidence,
  };
}
