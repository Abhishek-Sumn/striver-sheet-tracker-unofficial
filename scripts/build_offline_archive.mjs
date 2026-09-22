import fs from "node:fs/promises";
import path from "node:path";

const outputDir = path.resolve("outputs", "striver_sheet_archive_2026-07-29");
const sourcePath = path.join(outputDir, "striver_sheets_source.json");
const outputPath = path.join(outputDir, "striver_revision_ledger_offline.html");

const [sourceText, template, css, app] = await Promise.all([
  fs.readFile(sourcePath, "utf8"),
  fs.readFile(path.resolve("offline_archive", "template.html"), "utf8"),
  fs.readFile(path.resolve("offline_archive", "styles.css"), "utf8"),
  fs.readFile(path.resolve("offline_archive", "app.js"), "utf8"),
]);

const archive = JSON.parse(sourceText);
const totalProblems = archive.sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0);
const totalVideos = archive.sheets.reduce(
  (sum, sheet) => sum + sheet.rows.filter((row) => row.youtube_url).length,
  0,
);

if (totalProblems !== 665 || totalVideos !== 556) {
  throw new Error(`Source reconciliation failed: ${totalProblems} problems, ${totalVideos} videos`);
}

for (const placeholder of ["__ARCHIVE_CSS__", "__ARCHIVE_DATA__", "__ARCHIVE_JS__"]) {
  if (!template.includes(placeholder)) {
    throw new Error(`Template placeholder missing: ${placeholder}`);
  }
}

const embeddedData = JSON.stringify(archive)
  .replaceAll("<", "\\u003c")
  .replaceAll("\u2028", "\\u2028")
  .replaceAll("\u2029", "\\u2029");
const embeddedApp = app.replace(/<\/script/gi, "<\\/script");

const html = template
  .replace("__ARCHIVE_CSS__", css.trim())
  .replace("__ARCHIVE_DATA__", embeddedData)
  .replace("__ARCHIVE_JS__", embeddedApp.trim());

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, html, "utf8");

const size = Buffer.byteLength(html);
console.log(JSON.stringify({
  output: outputPath,
  bytes: size,
  problems: totalProblems,
  videos: totalVideos,
  sheets: archive.sheets.map((sheet) => ({ key: sheet.key, rows: sheet.rows.length })),
}));
