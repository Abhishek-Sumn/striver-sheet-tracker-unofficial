import fs from "node:fs/promises";
import path from "node:path";

const sourcePath = path.resolve("outputs", "striver_sheet_archive_2026-07-29", "striver_sheets_source.json");
const targetPath = path.resolve("src", "data", "sheets.json");

const content = await fs.readFile(sourcePath, "utf8");
const parsed = JSON.parse(content);

// Clean up any newlines or weird multi-spaces in subtopics / sections / names
for (const sheet of parsed.sheets) {
  for (const row of sheet.rows) {
    row.subtopic_name = row.subtopic_name ? row.subtopic_name.replace(/\s+/g, " ").trim() : "";
    row.section_name = row.section_name ? row.section_name.replace(/\s+/g, " ").trim() : "";
    row.problem_name = row.problem_name ? row.problem_name.replace(/\s+/g, " ").trim() : "";
  }
}

await fs.mkdir(path.dirname(targetPath), { recursive: true });
await fs.writeFile(targetPath, JSON.stringify(parsed, null, 2), "utf8");

console.log(`Synced ${parsed.sheets.reduce((acc, s) => acc + s.rows.length, 0)} problems to ${targetPath}`);
