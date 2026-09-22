import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert";

console.log("=== Running DSA Sheet Tracker Integrity Test Suite ===");

// 1. Verify Skill documentation exists
const skillPath = path.resolve(".agents", "skills", "striver-tracker", "SKILL.md");
const skillContent = await fs.readFile(skillPath, "utf8");
assert(skillContent.includes("striver-tracker"), "Skill must define striver-tracker");
assert(skillContent.includes("StorageAdapter"), "Skill must document StorageAdapter");
console.log("✓ Antigravity skill verified at .agents/skills/striver-tracker/SKILL.md");

// 2. Verify Canonical Data File
const sheetsDataPath = path.resolve("src", "data", "sheets.json");
const sheetsJson = JSON.parse(await fs.readFile(sheetsDataPath, "utf8"));
assert.strictEqual(sheetsJson.sheets.length, 2, "Expected 2 sheets");

const sde = sheetsJson.sheets.find((s) => s.key === "SDE");
const a2z = sheetsJson.sheets.find((s) => s.key === "A2Z");
assert(sde, "SDE sheet missing");
assert(a2z, "A2Z sheet missing");

assert.strictEqual(sde.rows.length, 191, `SDE row count expected 191, got ${sde.rows.length}`);
assert.strictEqual(a2z.rows.length, 455, `A2Z row count expected 455, got ${a2z.rows.length}`);

const allRows = sheetsJson.sheets.flatMap((s) => s.rows);
assert.strictEqual(allRows.length, 646, `Expected 646 total rows, got ${allRows.length}`);

// Invariant: unique composite slug keys
const keys = allRows.map((r) => `${r.sheet}:${r.id}`);
assert.strictEqual(new Set(keys).size, 646, "Duplicate sheet:id keys detected");

// Invariant: no legacy takeUforward fields
for (const r of allRows) {
  assert.strictEqual(r.problem_id, undefined, "Legacy problem_id must be removed");
  assert.strictEqual(r.section_id, undefined, "Legacy section_id must be removed");
  assert.strictEqual(r.subtopic_id, undefined, "Legacy subtopic_id must be removed");
  assert.strictEqual(r.source_url, undefined, "Legacy source_url must be removed");
  assert.strictEqual(r.sheet_last_updated, undefined, "Legacy sheet_last_updated must be removed");
  assert(typeof r.id === "string" && r.id.length > 0, "Each row must have a valid id slug");
}

// Invariant: migration map file exists with 646 entries
const mapPath = path.resolve("src", "data", "id_migration_map.json");
const migrationMap = JSON.parse(await fs.readFile(mapPath, "utf8"));
assert.strictEqual(Object.keys(migrationMap).length, 646, "Migration map must have exactly 646 entries");

// Invariant: videos
const videoRows = allRows.filter((r) => r.youtube_url);
assert.strictEqual(videoRows.length, 542, `Expected 542 videos, got ${videoRows.length}`);
console.log(`✓ Data integrity verified: 646 problems with unique slug IDs, 542 videos, 0 legacy TUF fields`);

// 3. Verify Components and Architecture Files
const requiredFiles = [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/globals.css",
  "src/types/sheet.ts",
  "src/lib/storage/types.ts",
  "src/lib/storage/localStorageAdapter.ts",
  "src/lib/storage/index.ts",
  "src/hooks/useTracker.ts",
  "src/components/DSAHeader.tsx",
  "src/components/DSAFilterBar.tsx",
  "src/components/DSAProgressCard.tsx",
  "src/components/DSASectionAccordion.tsx",
  "src/components/VideoModal.tsx",
  "src/components/NotesDrawer.tsx",
  "src/components/DataBackupModal.tsx",
  "src/components/RandomProblemModal.tsx",
  "src/components/AttributionBanner.tsx",
  "src/lib/site.ts",
  "src/lib/confetti.ts",
  "LICENSE",
];

for (const f of requiredFiles) {
  const stat = await fs.stat(path.resolve(f));
  assert(stat.isFile(), `Required file ${f} is missing`);
}
console.log(`✓ All ${requiredFiles.length} core architecture files verified present`);

console.log("=== All Verification Invariants Passed Successfully! ===");
