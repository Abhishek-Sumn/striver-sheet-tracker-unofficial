import {
  StorageAdapter,
  UserProgressState,
  ConfidenceRating,
  ImportResult,
  LastActiveProblem,
} from "./types";

export type {
  StorageAdapter,
  UserProgressState,
  ConfidenceRating,
  ImportResult,
  LastActiveProblem,
};

const STORAGE_KEY = "dsa_tracker_progress_v1";
const LEGACY_STORAGE_KEY = atob("c3RyaXZlcl90cmFja2VyX3Byb2dyZXNzX3Yx");
const CURRENT_VERSION = 1;

export const DEFAULT_STATE: UserProgressState = {
  solved: {},
  bookmarked: {},
  notes: {},
  confidence: {},
  completedAt: {},
  dailyGoal: 3,
  streak: { count: 0, lastActiveDate: "" },
  version: CURRENT_VERSION,
  lastActiveProblem: null,
  lastOpenedSection: null,
};

import { getLocalDateString, getLocalYesterdayString } from "../utils";

function getTodayString(): string {
  return getLocalDateString();
}

function getYesterdayString(): string {
  return getLocalYesterdayString();
}

import idMigrationMapJson from "../../data/id_migration_map.json";

const ID_MIGRATION_MAP: Record<string, string> = idMigrationMapJson as Record<string, string>;

function migrateRecordKeys<T>(record: Record<string, T> | undefined): { clean: Record<string, T>; migrated: boolean } {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { clean: {}, migrated: false };
  }
  let migrated = false;
  const clean: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    if (ID_MIGRATION_MAP[key]) {
      clean[ID_MIGRATION_MAP[key]] = value;
      migrated = true;
    } else {
      clean[key] = value;
    }
  }
  return { clean, migrated };
}

export class LocalStorageAdapter implements StorageAdapter {
  private memoryCache: UserProgressState | null = null;
  private subscribers: Set<(state: UserProgressState) => void> = new Set();
  private isClient: boolean;

  constructor() {
    this.isClient = typeof window !== "undefined";
    if (this.isClient) {
      window.addEventListener("storage", (event) => {
        if ((event.key === STORAGE_KEY || event.key === LEGACY_STORAGE_KEY) && event.newValue) {
          try {
            this.memoryCache = JSON.parse(event.newValue);
            this.notifySubscribers();
          } catch {
            // Ignore malformed external edits
          }
        }
      });
    }
  }

  private notifySubscribers(): void {
    const state = this.getCachedOrStoredState();
    this.subscribers.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error("Error in StorageAdapter subscriber callback:", err);
      }
    });
  }

  private getCachedOrStoredState(): UserProgressState {
    if (this.memoryCache) return this.memoryCache;

    if (!this.isClient) {
      return { ...DEFAULT_STATE };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) {
        this.memoryCache = { ...DEFAULT_STATE };
        return this.memoryCache;
      }
      const parsed = JSON.parse(raw);
      const solvedRes = migrateRecordKeys<boolean>(parsed.solved);
      const bookmarkedRes = migrateRecordKeys<boolean>(parsed.bookmarked);
      const notesRes = migrateRecordKeys<string>(parsed.notes);
      const confidenceRes = migrateRecordKeys<ConfidenceRating>(parsed.confidence);
      const completedAtRes = migrateRecordKeys<string>(parsed.completedAt);

      const anyMigrated =
        solvedRes.migrated ||
        bookmarkedRes.migrated ||
        notesRes.migrated ||
        confidenceRes.migrated ||
        completedAtRes.migrated;

      let cleanLastActiveProblem: LastActiveProblem | null = null;
      if (parsed.lastActiveProblem && typeof parsed.lastActiveProblem === "object") {
        const p = parsed.lastActiveProblem;
        if (typeof p.problemId === "string" && typeof p.sheet === "string") {
          cleanLastActiveProblem = {
            sheet: p.sheet,
            problemId: p.problemId,
            sectionName: typeof p.sectionName === "string" ? p.sectionName : "",
            subtopicName: typeof p.subtopicName === "string" ? p.subtopicName : undefined,
            problemName: typeof p.problemName === "string" ? p.problemName : "",
            updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : undefined,
          };
        }
      }

      const cleanLastOpenedSection =
        typeof parsed.lastOpenedSection === "string" && parsed.lastOpenedSection.trim().length > 0
          ? parsed.lastOpenedSection
          : null;

      this.memoryCache = {
        solved: solvedRes.clean,
        bookmarked: bookmarkedRes.clean,
        notes: notesRes.clean,
        confidence: confidenceRes.clean,
        completedAt: completedAtRes.clean,
        dailyGoal: typeof parsed.dailyGoal === "number" ? parsed.dailyGoal : 3,
        streak: parsed.streak || { count: 0, lastActiveDate: "" },
        version: CURRENT_VERSION,
        lastActiveProblem: cleanLastActiveProblem,
        lastOpenedSection: cleanLastOpenedSection,
      };

      if (anyMigrated && this.isClient) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryCache));
        } catch (err) {
          console.error("Failed to persist migrated state:", err);
        }
      }

      return this.memoryCache;
    } catch {
      this.memoryCache = { ...DEFAULT_STATE };
      return this.memoryCache;
    }
  }

  private persist(state: UserProgressState): void {
    this.memoryCache = state;
    if (this.isClient) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.error("Failed to write progress to LocalStorage:", err);
      }
    }
    this.notifySubscribers();
  }

  public async getState(): Promise<UserProgressState> {
    return { ...this.getCachedOrStoredState() };
  }

  public async saveState(state: UserProgressState): Promise<void> {
    this.persist({ ...state, version: CURRENT_VERSION });
  }

  public async toggleSolved(sheet: string, problemId: string): Promise<boolean> {
    const state = this.getCachedOrStoredState();
    const key = `${sheet}:${problemId}`;
    const wasSolved = Boolean(state.solved[key]);
    const nextSolved = !wasSolved;

    const newSolved = { ...state.solved };
    const newCompletedAt = { ...state.completedAt };

    if (nextSolved) {
      newSolved[key] = true;
      const today = getTodayString();
      newCompletedAt[key] = new Date().toISOString();

      // Update streak
      const currentStreak = { ...state.streak };
      if (currentStreak.lastActiveDate === today) {
        // Already active today
      } else if (currentStreak.lastActiveDate === getYesterdayString()) {
        currentStreak.count += 1;
        currentStreak.lastActiveDate = today;
      } else {
        currentStreak.count = 1;
        currentStreak.lastActiveDate = today;
      }

      this.persist({
        ...state,
        solved: newSolved,
        completedAt: newCompletedAt,
        streak: currentStreak,
      });
    } else {
      delete newSolved[key];
      delete newCompletedAt[key];
      this.persist({
        ...state,
        solved: newSolved,
        completedAt: newCompletedAt,
      });
    }

    return nextSolved;
  }

  public async toggleBookmarked(sheet: string, problemId: string): Promise<boolean> {
    const state = this.getCachedOrStoredState();
    const key = `${sheet}:${problemId}`;
    const nextBookmarked = !state.bookmarked[key];

    const newBookmarked = { ...state.bookmarked };
    if (nextBookmarked) {
      newBookmarked[key] = true;
    } else {
      delete newBookmarked[key];
    }

    this.persist({
      ...state,
      bookmarked: newBookmarked,
    });

    return nextBookmarked;
  }

  public async saveNotes(sheet: string, problemId: string, notes: string): Promise<void> {
    const state = this.getCachedOrStoredState();
    const key = `${sheet}:${problemId}`;
    const newNotes = { ...state.notes };

    if (notes.trim().length > 0) {
      newNotes[key] = notes;
    } else {
      delete newNotes[key];
    }

    this.persist({
      ...state,
      notes: newNotes,
    });
  }

  public async setConfidence(
    sheet: string,
    problemId: string,
    level: ConfidenceRating | null
  ): Promise<void> {
    const state = this.getCachedOrStoredState();
    const key = `${sheet}:${problemId}`;
    const newConfidence = { ...state.confidence };

    if (level) {
      newConfidence[key] = level;
    } else {
      delete newConfidence[key];
    }

    this.persist({
      ...state,
      confidence: newConfidence,
    });
  }

  public async setDailyGoal(goal: number): Promise<void> {
    const state = this.getCachedOrStoredState();
    this.persist({
      ...state,
      dailyGoal: Math.max(1, Math.min(50, goal)),
    });
  }

  public async setLastActiveProblem(problem: LastActiveProblem | null): Promise<void> {
    const state = this.getCachedOrStoredState();
    if (
      (!problem && !state.lastActiveProblem) ||
      (problem &&
        state.lastActiveProblem &&
        state.lastActiveProblem.sheet === problem.sheet &&
        state.lastActiveProblem.problemId === problem.problemId)
    ) {
      return;
    }
    this.persist({
      ...state,
      lastActiveProblem: problem,
      lastOpenedSection: problem ? `${problem.sheet}::${problem.sectionName}` : state.lastOpenedSection,
    });
  }

  public async setLastOpenedSection(sectionKey: string | null): Promise<void> {
    const state = this.getCachedOrStoredState();
    if (state.lastOpenedSection === sectionKey) {
      return;
    }
    this.persist({
      ...state,
      lastOpenedSection: sectionKey,
    });
  }

  public async exportData(): Promise<string> {
    const state = await this.getState();
    const payload = {
      app: "dsa-sheet-tracker",
      exportedAt: new Date().toISOString(),
      state,
    };
    return JSON.stringify(payload, null, 2);
  }

  public async importData(
    jsonString: string,
    mode: "merge" | "replace" = "merge"
  ): Promise<ImportResult> {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return { success: false, importedCount: 0, error: "Root JSON must be an object." };
      }

      const incomingState = (data.state && typeof data.state === "object" && !Array.isArray(data.state))
        ? data.state
        : data;

      if (!incomingState || typeof incomingState !== "object" || Array.isArray(incomingState)) {
        return { success: false, importedCount: 0, error: "Invalid backup state structure." };
      }

      // Strict sanitizers to guard against string spreading, non-objects, and corrupted types
      const sanitizeBooleanMap = (raw: unknown): Record<string, boolean> => {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
        const clean: Record<string, boolean> = {};
        for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
          if (typeof k === "string" && Boolean(v)) {
            clean[k] = true;
          }
        }
        return clean;
      };

      const sanitizeStringMap = (raw: unknown): Record<string, string> => {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
        const clean: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
          if (typeof k === "string" && typeof v === "string" && v.trim().length > 0) {
            clean[k] = v;
          }
        }
        return clean;
      };

      const sanitizeConfidenceMap = (raw: unknown): Record<string, ConfidenceRating> => {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
        const clean: Record<string, ConfidenceRating> = {};
        for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
          if (v === "easy" || v === "medium" || v === "hard") {
            clean[k] = v;
          }
        }
        return clean;
      };

      const cleanIncomingSolved = migrateRecordKeys(sanitizeBooleanMap(incomingState.solved)).clean;
      const cleanIncomingBookmarked = migrateRecordKeys(sanitizeBooleanMap(incomingState.bookmarked)).clean;
      const cleanIncomingNotes = migrateRecordKeys(sanitizeStringMap(incomingState.notes)).clean;
      const cleanIncomingConfidence = migrateRecordKeys(sanitizeConfidenceMap(incomingState.confidence)).clean;
      const cleanIncomingCompletedAt = migrateRecordKeys(sanitizeStringMap(incomingState.completedAt)).clean;

      const cleanDailyGoal =
        typeof incomingState.dailyGoal === "number" && incomingState.dailyGoal > 0
          ? Math.min(50, Math.max(1, incomingState.dailyGoal))
          : undefined;

      const cleanStreak =
        incomingState.streak && typeof incomingState.streak === "object" && !Array.isArray(incomingState.streak)
          ? {
              count: typeof incomingState.streak.count === "number" ? Math.max(0, incomingState.streak.count) : 0,
              lastActiveDate: typeof incomingState.streak.lastActiveDate === "string" ? incomingState.streak.lastActiveDate : "",
            }
          : undefined;

      let cleanIncomingLastProblem: LastActiveProblem | null = null;
      if (incomingState.lastActiveProblem && typeof incomingState.lastActiveProblem === "object") {
        const p = incomingState.lastActiveProblem;
        if (typeof p.problemId === "string" && typeof p.sheet === "string") {
          cleanIncomingLastProblem = {
            sheet: p.sheet,
            problemId: p.problemId,
            sectionName: typeof p.sectionName === "string" ? p.sectionName : "",
            subtopicName: typeof p.subtopicName === "string" ? p.subtopicName : undefined,
            problemName: typeof p.problemName === "string" ? p.problemName : "",
            updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : undefined,
          };
        }
      }

      const cleanIncomingLastSection =
        typeof incomingState.lastOpenedSection === "string" && incomingState.lastOpenedSection.trim().length > 0
          ? incomingState.lastOpenedSection
          : null;

      const currentState = this.getCachedOrStoredState();

      let targetState: UserProgressState;
      if (mode === "replace") {
        targetState = {
          solved: cleanIncomingSolved,
          bookmarked: cleanIncomingBookmarked,
          notes: cleanIncomingNotes,
          confidence: cleanIncomingConfidence,
          completedAt: cleanIncomingCompletedAt,
          dailyGoal: cleanDailyGoal || currentState.dailyGoal || 3,
          streak: cleanStreak || { count: 0, lastActiveDate: "" },
          version: CURRENT_VERSION,
          lastActiveProblem: cleanIncomingLastProblem,
          lastOpenedSection: cleanIncomingLastSection,
        };
      } else {
        // Safe deep merge
        targetState = {
          solved: { ...currentState.solved, ...cleanIncomingSolved },
          bookmarked: { ...currentState.bookmarked, ...cleanIncomingBookmarked },
          notes: { ...currentState.notes, ...cleanIncomingNotes },
          confidence: { ...currentState.confidence, ...cleanIncomingConfidence },
          completedAt: { ...currentState.completedAt, ...cleanIncomingCompletedAt },
          dailyGoal: cleanDailyGoal || currentState.dailyGoal || 3,
          streak: cleanStreak || currentState.streak || { count: 0, lastActiveDate: "" },
          version: CURRENT_VERSION,
          lastActiveProblem: cleanIncomingLastProblem || currentState.lastActiveProblem || null,
          lastOpenedSection: cleanIncomingLastSection || currentState.lastOpenedSection || null,
        };
      }

      this.persist(targetState);
      const importedCount = Object.keys(targetState.solved).length;

      return { success: true, importedCount };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse import JSON";
      return { success: false, importedCount: 0, error: errorMessage };
    }
  }

  public async resetAll(): Promise<void> {
    this.persist({ ...DEFAULT_STATE });
  }

  public subscribe(callback: (state: UserProgressState) => void): () => void {
    this.subscribers.add(callback);
    // Initial call
    callback(this.getCachedOrStoredState());
    return () => {
      this.subscribers.delete(callback);
    };
  }
}
