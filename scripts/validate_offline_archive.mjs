import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const htmlPath = path.resolve(
  "outputs",
  "striver_sheet_archive_2026-07-29",
  "striver_revision_ledger_offline.html",
);
const html = await fs.readFile(htmlPath, "utf8");
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

const dataMatch = html.match(/<script id="archive-data" type="application\/json">([\s\S]*?)<\/script>/);
check(Boolean(dataMatch), "Embedded archive JSON is missing");
const archive = dataMatch ? JSON.parse(dataMatch[1]) : { sheets: [] };
const rows = archive.sheets.flatMap((sheet) => sheet.rows);

check(rows.length === 665, `Expected 665 rows, found ${rows.length}`);
check(archive.sheets.find((sheet) => sheet.key === "SDE")?.rows.length === 191, "SDE row count is not 191");
check(archive.sheets.find((sheet) => sheet.key === "A2Z")?.rows.length === 474, "A2Z row count is not 474");
check(archive.sheets.find((sheet) => sheet.key === "SDE")?.section_count === 27, "SDE section count is not 27");
check(archive.sheets.find((sheet) => sheet.key === "A2Z")?.section_count === 18, "A2Z section count is not 18");

const expectedDifficulty = {
  SDE: { Easy: 25, Medium: 93, Hard: 73 },
  A2Z: { Easy: 152, Medium: 186, Hard: 136 },
};
for (const [sheet, expected] of Object.entries(expectedDifficulty)) {
  for (const [difficulty, count] of Object.entries(expected)) {
    const actual = rows.filter((row) => row.sheet === sheet && row.difficulty === difficulty).length;
    check(actual === count, `${sheet} ${difficulty} expected ${count}, found ${actual}`);
  }
}

const videos = rows.filter((row) => row.youtube_url);
check(videos.length === 556, `Expected 556 YouTube links, found ${videos.length}`);
check(
  videos.every((row) => /^(?:https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(row.youtube_url)),
  "A listed video URL does not point to YouTube",
);

const keys = rows.map((row) => `${row.sheet}:${row.problem_id}`);
check(new Set(keys).size === keys.length, "Duplicate sheet/problem IDs were found");
check(rows.every((row) => row.problem_name && row.section_name && row.difficulty), "A required row field is blank");

const urlFields = [
  "source_url",
  "practice_url",
  "external_practice_url",
  "youtube_url",
  "article_url",
  "tuf_plus_url",
  "editorial_url",
];
for (const row of rows) {
  for (const field of urlFields) {
    if (row[field]) {
      check(row[field].startsWith("https://"), `Non-HTTPS URL at ${row.sheet} #${row.number} ${field}`);
    }
  }
}

check(!html.includes("__ARCHIVE_"), "An unexpanded template placeholder remains");
check(!html.includes("$undefined"), "An undefined source sentinel remains");
check(!/<script[^>]+src=/i.test(html), "External script dependency found");
check(!/<link[^>]+rel=["']stylesheet["']/i.test(html), "External stylesheet dependency found");
check(!/\bfetch\s*\(/.test(html), "Runtime network fetch found");
check(html.includes("Set Matrix Zeroes"), "Representative first SDE problem is missing");
check(html.includes("Count Palindromic Subsequences"), "Representative final A2Z problem is missing");

for (const id of [
  "search-input",
  "difficulty-filter",
  "platform-filter",
  "video-filter",
  "status-filter",
  "problem-list",
  "export-button",
  "import-button",
]) {
  check(html.includes(`id="${id}"`), `Required control #${id} is missing`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

const sha256 = crypto.createHash("sha256").update(html).digest("hex");
console.log(JSON.stringify({
  ok: true,
  file: htmlPath,
  bytes: Buffer.byteLength(html),
  sha256,
  rows: rows.length,
  videos: videos.length,
  externalPracticeLinks: rows.filter((row) => row.external_practice_url).length,
  takeUforwardPracticeLinks: rows.filter((row) => row.platform === "takeUforward").length,
  missingOfficialPracticeLinks: rows.filter((row) => row.platform === "No official practice link").length,
}, null, 2));
