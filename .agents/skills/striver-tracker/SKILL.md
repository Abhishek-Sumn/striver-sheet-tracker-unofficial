---
name: striver-tracker
description: Operational handbook, data ingestion runbook, storage architecture guide, and deployment manual for the Striver Sheet Tracker Next.js application.
version: 1.0.0
tags:
  - nextjs
  - tailwindcss
  - dsa-tracker
  - localstorage
  - striver-sheet
---

# Striver Sheet Tracker — Operations & Engineering Skill

This skill documents the operational procedures, architecture, data pipelines, and maintenance tasks for the **Striver Sheet Tracker** web application (`striver-sheet-tracker`).

---

## 1. System Architecture Overview

The tracker is built with **Next.js 15 (App Router)**, **TypeScript**, and **Tailwind CSS**. It provides an ultra-fast, local-first interactive interface for 665 coding interview questions curated by Striver (takeUforward) across two canonical sheets:
1. **Striver SDE Sheet**: 191 problems across 27 sections (Arrays, Linked Lists, Greedy, Binary Trees, DP, etc.).
2. **Striver A2Z DSA Sheet**: 474 problems across 18 high-yield sections (Basics, Sorting, Arrays, Binary Search, Strings, Trees, Graphs, DP, Tries, Advanced).

### Key Architectural Layers

```
src/
├── app/                  # Next.js App Router (layout, global styling, page coordinator)
├── components/           # High-density UI components (cards, accordions, modals, stats)
├── data/                 # Canonical problem database (sheets.json - 665 problems)
├── hooks/                # React state & sync hooks (useTracker, useConfetti)
├── lib/
│   ├── storage/          # StorageAdapter pattern (LocalStorageAdapter + Cloud interfaces)
│   └── utils.ts          # Class merging, string normalization, math helpers
├── types/                # TypeScript domain models (Sheet, Problem, ProgressState, Filters)
```

---

## 2. Storage Architecture & Cloud Sync Migration Guide

### 2.1 The `StorageAdapter` Pattern

To support offline-first local tracking today while allowing painless migration to cloud backends (Supabase, Firebase, or custom REST/GraphQL APIs) tomorrow, all storage mutations go through the `StorageAdapter` interface:

```typescript
export interface StorageAdapter {
  getState(): Promise<UserProgressState>;
  saveState(state: UserProgressState): Promise<void>;
  toggleSolved(sheet: string, problemId: string): Promise<boolean>;
  toggleBookmarked(sheet: string, problemId: string): Promise<boolean>;
  saveNotes(sheet: string, problemId: string, notes: string): Promise<void>;
  setConfidence(sheet: string, problemId: string, level: 'easy' | 'medium' | 'hard' | null): Promise<void>;
  setDailyGoal(goal: number): Promise<void>;
  exportData(): Promise<string>;
  importData(jsonString: string): Promise<{ success: boolean; importedCount: number; error?: string }>;
  resetAll(): Promise<void>;
  subscribe(callback: (state: UserProgressState) => void): () => void;
}
```

### 2.2 LocalStorageAdapter Details
- **Storage Key**: `striver_tracker_progress_v1`
- **Schema**:
  - `solved`: `{ [compositeKey: string]: boolean }` (key format: `${sheet}:${problem_id}`)
  - `bookmarked`: `{ [compositeKey: string]: boolean }`
  - `notes`: `{ [compositeKey: string]: string }`
  - `confidence`: `{ [compositeKey: string]: 'easy' | 'medium' | 'hard' }`
  - `completedAt`: `{ [compositeKey: string]: string }` (ISO timestamp for streak and velocity analytics)
  - `dailyGoal`: number (default: 3)
  - `streak`: `{ count: number; lastActiveDate: string }`
  - `version`: number

### 2.3 Cloud Migration Steps (e.g., Supabase / Firebase)
When transitioning to cloud persistence:
1. Create `src/lib/storage/cloudStorageAdapter.ts` implementing `StorageAdapter`.
2. Map local state to relational or document tables:
   ```sql
   CREATE TABLE user_problem_progress (
     user_id UUID REFERENCES auth.users(id),
     sheet_key VARCHAR(10) NOT NULL,
     problem_id VARCHAR(50) NOT NULL,
     is_solved BOOLEAN DEFAULT FALSE,
     is_bookmarked BOOLEAN DEFAULT FALSE,
     confidence VARCHAR(10),
     notes TEXT,
     completed_at TIMESTAMPTZ,
     PRIMARY KEY (user_id, sheet_key, problem_id)
   );
   ```
3. Provide an automatic offline-to-cloud synchronization step on initial login by calling `localStorageAdapter.exportData()` and writing it to the cloud adapter.
4. Switch the singleton in `src/lib/storage/index.ts` to instantiate `CloudStorageAdapter` when authentication tokens are present, falling back to `LocalStorageAdapter` for guests.

---

## 3. Data Ingestion Runbook

The canonical dataset is stored in:
- Source archive: `outputs/striver_sheet_archive_2026-07-29/striver_sheets_source.json`
- Next.js application data: `src/data/sheets.json`

### 3.1 Scraping / Refreshing from takeUforward
To refresh the dataset from live takeUforward endpoints:
1. Run the extraction script:
   ```bash
   node scripts/extract_striver_sheets.mjs
   ```
2. Verify that extracted data conforms to invariants:
   - SDE Sheet: 191 problems, 27 sections.
   - A2Z Sheet: 474 problems, 18 sections.
   - Total rows: 665.
   - YouTube video links: >= 556 valid URLs.
3. Validate using the test script:
   ```bash
   node scripts/validate_offline_archive.mjs
   ```
4. Copy or rebuild the bundled data into `src/data/sheets.json`:
   ```bash
   node scripts/sync_sheets_data.mjs
   ```

### 3.2 Key Invariants & Edge Cases
- **Subtopic Newlines**: Raw scraper output might contain `\n` in specific subtopics (e.g., `Learn STL/Java-Collections or similar thing in your\n            language`). Always normalize multiple whitespaces and newlines with `.replace(/\s+/g, ' ').trim()`.
- **Composite ID**: Always reference problems across sheets using `${row.sheet}:${row.problem_id}` because problem IDs are sheet-scoped.

---

## 4. Build, Development & Deployment Runbook

### 4.1 Development Server
```bash
npm run dev
```
Runs the development server on `http://localhost:3000` with hot-module replacement.

### 4.2 Production Build
```bash
npm run build
```
Executes TypeScript type checking, linting, Next.js route generation, and code bundling.

### 4.3 Static HTML Export (For GitHub Pages or Pure Static CDN)
If hosting on static hosting without Node.js server:
1. In `next.config.ts`, set:
   ```typescript
   const nextConfig: NextConfig = {
     output: 'export',
     images: { unoptimized: true },
   };
   export default nextConfig;
   ```
2. Run `npm run build`. The output will be in `./out`.

### 4.4 Vercel / Cloudflare Pages Deployment
- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Output Directory: `.next` (or default)
- Node.js Version: `>= 18.x` (recommended `20.x` or `24.x`).

---

## 5. Feature Matrix & User Capabilities

| Feature | Description |
| :--- | :--- |
| **Dual Sheet Switching** | One-click switch between SDE Sheet (191) and A2Z Sheet (474), with independent progress metrics. |
| **Interactive Dashboard** | Live circular progress rings, difficulty breakdown (Easy, Medium, Hard), solved velocity, and streak tracker. |
| **Section & Subtopic Accordions** | Hierarchical collapsible sections with batch Expand/Collapse All and section completion badges. |
| **Multi-faceted Filtering** | Real-time search across problem titles, IDs, section names; filter by difficulty, platform, status (Solved/Unsolved/Revision/Has Notes), and media availability. |
| **In-App Video Modal** | Embedded distraction-free YouTube player for 556+ video explanations directly inside the tracker. |
| **In-App Notes Drawer** | Dedicated markdown note editor per problem with instant autosave to localStorage. |
| **Random Problem Picker** | Quick warmup shuffler with difficulty and sheet filters to immediately break decision fatigue. |
| **Data Backup & Restore** | JSON Export and Import with validation to guarantee no user loses progress. |
