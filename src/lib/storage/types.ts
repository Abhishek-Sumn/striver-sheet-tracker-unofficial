export type ConfidenceRating = "easy" | "medium" | "hard";

export interface UserStreak {
  count: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface LastActiveProblem {
  sheet: string;
  problemId: string;
  sectionName: string;
  subtopicName?: string;
  problemName: string;
  updatedAt?: string;
}

export interface UserProgressState {
  solved: Record<string, boolean>; // key: `${sheet}:${slugId}`
  bookmarked: Record<string, boolean>;
  notes: Record<string, string>;
  confidence: Record<string, ConfidenceRating>;
  completedAt: Record<string, string>; // ISO date strings
  dailyGoal: number;
  streak: UserStreak;
  version: number;
  lastActiveProblem?: LastActiveProblem | null;
  lastOpenedSection?: string | null;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  error?: string;
}

export interface StorageAdapter {
  getState(): Promise<UserProgressState>;
  saveState(state: UserProgressState): Promise<void>;
  toggleSolved(sheet: string, problemId: string): Promise<boolean>;
  toggleBookmarked(sheet: string, problemId: string): Promise<boolean>;
  saveNotes(sheet: string, problemId: string, notes: string): Promise<void>;
  setConfidence(sheet: string, problemId: string, level: ConfidenceRating | null): Promise<void>;
  setDailyGoal(goal: number): Promise<void>;
  setLastActiveProblem(problem: LastActiveProblem | null): Promise<void>;
  setLastOpenedSection(sectionKey: string | null): Promise<void>;
  exportData(): Promise<string>;
  importData(jsonString: string, mode?: "merge" | "replace"): Promise<ImportResult>;
  resetAll(): Promise<void>;
  subscribe(callback: (state: UserProgressState) => void): () => void;
}
