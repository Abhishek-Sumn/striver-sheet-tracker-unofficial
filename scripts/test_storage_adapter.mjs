import assert from "node:assert";

// Mock minimal browser window & localStorage for Node runtime testing
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.localStorage = new MockLocalStorage();

const { LocalStorageAdapter, DEFAULT_STATE } = await import("../src/lib/storage/localStorageAdapter.ts");

console.log("=== Testing LocalStorageAdapter Core Features & ID Migration ===");

const adapter = new LocalStorageAdapter();

// 1. Initial state
const state0 = await adapter.getState();
assert.deepStrictEqual(state0.solved, {}, "Initial solved should be empty");
assert.deepStrictEqual(state0.bookmarked, {}, "Initial bookmarked should be empty");
assert.strictEqual(state0.dailyGoal, 3, "Initial daily goal should be 3");
console.log("✓ Initial state matches DEFAULT_STATE");

// 2. Toggling Solved with slug ID
const solved1 = await adapter.toggleSolved("SDE", "set-matrix-zeroes");
assert.strictEqual(solved1, true, "Should return true when solved");
const state1 = await adapter.getState();
assert.strictEqual(state1.solved["SDE:set-matrix-zeroes"], true, "SDE:set-matrix-zeroes should be marked solved");
assert.strictEqual(state1.streak.count, 1, "Streak should be incremented to 1");
assert(Boolean(state1.completedAt["SDE:set-matrix-zeroes"]), "CompletedAt timestamp must be recorded");

// Toggle off
const solvedOff = await adapter.toggleSolved("SDE", "set-matrix-zeroes");
assert.strictEqual(solvedOff, false, "Should return false when unmarking solved");
const stateOff = await adapter.getState();
assert.strictEqual(stateOff.solved["SDE:set-matrix-zeroes"], undefined, "SDE:set-matrix-zeroes should no longer be solved");
assert.strictEqual(stateOff.completedAt["SDE:set-matrix-zeroes"], undefined, "CompletedAt should be removed");
console.log("✓ Toggle solved & unmark solved verified");

// 3. Toggling Bookmarked
await adapter.toggleBookmarked("A2Z", "recursive-bubble-sort");
const stateBm1 = await adapter.getState();
assert.strictEqual(stateBm1.bookmarked["A2Z:recursive-bubble-sort"], true, "A2Z:recursive-bubble-sort should be bookmarked");
await adapter.toggleBookmarked("A2Z", "recursive-bubble-sort");
const stateBm2 = await adapter.getState();
assert.strictEqual(stateBm2.bookmarked["A2Z:recursive-bubble-sort"], undefined, "A2Z:recursive-bubble-sort should be unbookmarked");
console.log("✓ Bookmark toggle verified");

// 4. Notes & Confidence
await adapter.saveNotes("SDE", "next-permutation", "Kadane / Lexicographic algorithm works in O(N)");
const stateNotes = await adapter.getState();
assert.strictEqual(stateNotes.notes["SDE:next-permutation"], "Kadane / Lexicographic algorithm works in O(N)");

await adapter.setConfidence("SDE", "next-permutation", "easy");
const stateConf = await adapter.getState();
assert.strictEqual(stateConf.confidence["SDE:next-permutation"], "easy");
console.log("✓ Notes and Confidence tracking verified");

// 5. Pub/Sub Subscriptions
let subscriptionFired = false;
let observedSolvedCount = 0;
const unsubscribe = adapter.subscribe((st) => {
  subscriptionFired = true;
  observedSolvedCount = Object.keys(st.solved).length;
});
await adapter.toggleSolved("A2Z", "reverse-linked-list");
assert(subscriptionFired, "Subscriber callback should fire on state change");
assert.strictEqual(observedSolvedCount, 1, "Subscriber should see 1 solved problem");
unsubscribe();
console.log("✓ Pub/Sub subscription verified");

// 6. Export and Import
const exportPayload = await adapter.exportData();
assert(typeof exportPayload === "string", "Export payload must be a string");
const parsedExport = JSON.parse(exportPayload);
assert.strictEqual(parsedExport.app, "dsa-sheet-tracker");
assert.strictEqual(parsedExport.state.solved["A2Z:reverse-linked-list"], true);

// Reset and re-import
await adapter.resetAll();
const postResetState = await adapter.getState();
assert.deepStrictEqual(postResetState.solved, {}, "State should be empty after reset");

const importRes = await adapter.importData(exportPayload);
assert(importRes.success, "Import should succeed");
assert.strictEqual(importRes.importedCount, 1, "Import count should be 1");
const reloadedState = await adapter.getState();
assert.strictEqual(reloadedState.solved["A2Z:reverse-linked-list"], true, "Restored state must contain solved question");
console.log("✓ Export, Reset, and Import round-trip verified");

// 7. Backward Compatibility: One-Time ID Migration on Load
// Simulate existing user with legacy IDs in localStorage (e.g. SDE:911, SDE:31, A2Z:rvrsllrcrsiv)
globalThis.localStorage.clear();
const legacyState = {
  solved: {
    "SDE:911": true,
    "SDE:31": true,
  },
  bookmarked: {
    "SDE:911": true,
  },
  notes: {
    "SDE:31": "Note from before migration",
    "A2Z:rvrsllrcrsiv": "Recursive LL notes",
  },
  confidence: {
    "SDE:911": "easy",
  },
  completedAt: {
    "SDE:911": "2026-07-28T19:28:06.868Z",
  },
  dailyGoal: 5,
  streak: { count: 3, lastActiveDate: "2026-07-28" },
  version: 1,
};
globalThis.localStorage.setItem("dsa_tracker_progress_v1", JSON.stringify(legacyState));

// Create a new adapter instance to trigger load & migration
const migrationAdapter = new LocalStorageAdapter();
const migratedState = await migrationAdapter.getState();

// Assert that old keys are seamlessly translated to new slug keys
assert.strictEqual(migratedState.solved["SDE:set-matrix-zeroes"], true, "SDE:911 must migrate to SDE:set-matrix-zeroes");
assert.strictEqual(migratedState.solved["SDE:next-permutation"], true, "SDE:31 must migrate to SDE:next-permutation");
assert.strictEqual(migratedState.solved["SDE:911"], undefined, "Old key SDE:911 must be removed");
assert.strictEqual(migratedState.bookmarked["SDE:set-matrix-zeroes"], true, "Bookmark must migrate to SDE:set-matrix-zeroes");
assert.strictEqual(migratedState.notes["SDE:next-permutation"], "Note from before migration", "Notes must migrate to SDE:next-permutation");
assert.strictEqual(migratedState.notes["A2Z:reverse-linked-list-reverse-a-ll-recursive"], "Recursive LL notes", "A2Z legacy key must migrate to slug");
assert.strictEqual(migratedState.confidence["SDE:set-matrix-zeroes"], "easy", "Confidence must migrate to SDE:set-matrix-zeroes");
assert.strictEqual(migratedState.completedAt["SDE:set-matrix-zeroes"], "2026-07-28T19:28:06.868Z", "CompletedAt must migrate");
console.log("✓ One-time ID migration on load verified successfully");

// 8. Backward Compatibility: Migration on Import of Legacy Backup
const legacyBackupPayload = JSON.stringify({
  app: "dsa-sheet-tracker",
  state: {
    solved: {
      "SDE:813": true, // Pascal's triangle
    },
    notes: {
      "SDE:813": "Pascal's triangle notes from legacy backup",
    },
  },
});
const legacyImportRes = await migrationAdapter.importData(legacyBackupPayload, "merge");
assert(legacyImportRes.success, "Legacy import should succeed");
const stateAfterLegacyImport = await migrationAdapter.getState();
assert.strictEqual(stateAfterLegacyImport.solved["SDE:pascals-triangle"], true, "Imported SDE:813 must migrate to SDE:pascals-triangle");
assert.strictEqual(stateAfterLegacyImport.notes["SDE:pascals-triangle"], "Pascal's triangle notes from legacy backup");
console.log("✓ One-time ID migration on legacy backup import verified successfully");

// 9. Malformed Import Guard
const badImport = await migrationAdapter.importData("INVALID_JSON_GARBAGE");
assert.strictEqual(badImport.success, false, "Malformed JSON should fail gracefully");
assert(Boolean(badImport.error), "Error message should be present");
console.log("✓ Malformed import error handling verified");

// 10. Array Root Guard
const arrayImport = await migrationAdapter.importData("[1, 2, 3]");
assert.strictEqual(arrayImport.success, false, "Array root must be rejected");
console.log("✓ Array root rejection verified");

// 11. Schema Sanitization & String Spreading Guard
const corruptedPayload = JSON.stringify({
  app: "dsa-sheet-tracker",
  state: {
    solved: "corrupted_string_not_an_object",
    notes: 12345,
    confidence: "invalid_confidence_rating",
  },
});
const sanitizeRes = await migrationAdapter.importData(corruptedPayload, "replace");
assert.strictEqual(sanitizeRes.success, true);
const sanitizedState = await migrationAdapter.getState();
assert.strictEqual(sanitizedState.solved["0"], undefined, "Must not spread string into character keys");
assert.deepStrictEqual(sanitizedState.solved, {}, "Invalid solved type must become empty record");
assert.deepStrictEqual(sanitizedState.notes, {}, "Invalid notes type must become empty record");
assert.deepStrictEqual(sanitizedState.confidence, {}, "Invalid confidence type must become empty record");
console.log("✓ Schema sanitization & string-spreading guard verified");

// 12. Last Active Problem & Opened Section Tracking
await migrationAdapter.setLastActiveProblem({
  sheet: "A2Z",
  problemId: "search-insert-position",
  sectionName: "Step 4: Binary Search",
  subtopicName: "BS on 1D Arrays",
  problemName: "Search Insert Position",
});
const stateLast = await migrationAdapter.getState();
assert.deepStrictEqual(stateLast.lastActiveProblem, {
  sheet: "A2Z",
  problemId: "search-insert-position",
  sectionName: "Step 4: Binary Search",
  subtopicName: "BS on 1D Arrays",
  problemName: "Search Insert Position",
}, "Last active problem must match");
assert.strictEqual(stateLast.lastOpenedSection, "A2Z::Step 4: Binary Search", "Last opened section must match problem section");

// Explicitly set opened section
await migrationAdapter.setLastOpenedSection("A2Z::Step 3: Solve Problems on Arrays");
const stateSec = await migrationAdapter.getState();
assert.strictEqual(stateSec.lastOpenedSection, "A2Z::Step 3: Solve Problems on Arrays");

// Round trip export & import
const exportWithLast = await migrationAdapter.exportData();
await migrationAdapter.resetAll();
const postResetLast = await migrationAdapter.getState();
assert.strictEqual(postResetLast.lastActiveProblem, null, "ResetAll should clear last active problem");
assert.strictEqual(postResetLast.lastOpenedSection, null, "ResetAll should clear last opened section");

await migrationAdapter.importData(exportWithLast, "replace");
const restoredLast = await migrationAdapter.getState();
assert.strictEqual(restoredLast.lastActiveProblem?.problemId, "search-insert-position");
assert.strictEqual(restoredLast.lastOpenedSection, "A2Z::Step 3: Solve Problems on Arrays");
console.log("✓ Last Active Problem & Opened Section persistence, export, reset, and import verified");

console.log("=== All LocalStorageAdapter & ID Migration Tests Passed! ===");
