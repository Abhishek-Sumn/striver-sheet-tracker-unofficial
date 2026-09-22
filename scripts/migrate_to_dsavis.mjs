import fs from "fs";
import path from "path";

const sheetsPath = path.resolve("src", "data", "sheets.json");
const migrationMapPath = path.resolve("src", "data", "id_migration_map.json");

const raw = fs.readFileSync(sheetsPath, "utf8");
const data = JSON.parse(raw);

function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const migrationMap = {}; // oldKey -> newKey
const sheetSlugs = new Map();

const cleanedSheets = data.sheets.map((sheet) => {
  const seenSlugs = new Set();
  sheetSlugs.set(sheet.key, seenSlugs);

  const cleanedRows = sheet.rows.map((row) => {
    const oldKey = `${row.sheet}:${row.problem_id}`;

    // 1. Slug generation: derive from LeetCode URL if available, else problem name
    let baseSlug = "";
    const url = row.practice_url || row.external_practice_url || "";
    const lcMatch = url.match(/leetcode\.com\/problems\/([^/?#]+)/i);

    if (lcMatch) {
      baseSlug = lcMatch[1].toLowerCase().trim();
    } else {
      baseSlug = toSlug(row.problem_name);
    }

    // 2. Disambiguate if collision exists in the same sheet
    let finalSlug = baseSlug;
    if (seenSlugs.has(finalSlug)) {
      const nameSlug = toSlug(row.problem_name);
      if (nameSlug && !finalSlug.includes(nameSlug)) {
        finalSlug = `${baseSlug}-${nameSlug}`;
      }
      let counter = 2;
      let candidate = finalSlug;
      while (seenSlugs.has(candidate)) {
        candidate = `${finalSlug}-${counter}`;
        counter++;
      }
      finalSlug = candidate;
    }

    seenSlugs.add(finalSlug);

    const newKey = `${row.sheet}:${finalSlug}`;
    migrationMap[oldKey] = newKey;

    // 3. Clean problem object: delete takeUforward specific fields
    return {
      sheet: row.sheet,
      id: finalSlug,
      slug: finalSlug,
      number: row.number,
      section_number: row.section_number,
      section_name: row.section_name,
      subtopic_number: row.subtopic_number,
      subtopic_name: row.subtopic_name,
      section_problem_number: row.section_problem_number,
      subtopic_problem_number: row.subtopic_problem_number,
      problem_name: row.problem_name,
      difficulty: row.difficulty,
      platform: row.platform,
      practice_url: row.practice_url,
      external_practice_url: row.external_practice_url,
      youtube_url: row.youtube_url,
      youtube_video_id: row.youtube_video_id,
      article_url: row.article_url || "",
      editorial_url: row.editorial_url || "",
      resource_url: row.resource_url || "",
    };
  });

  return {
    key: sheet.key,
    url: "",
    metadata: {
      title: "TODO_TITLE",
      tagline: "TODO_TAGLINE",
      description: "TODO_DESCRIPTION",
    },
    section_count: sheet.section_count,
    row_count: cleanedRows.length,
    rows: cleanedRows,
  };
});

const cleanedDataset = {
  app: "dsavis",
  sheets: cleanedSheets,
};

fs.writeFileSync(sheetsPath, JSON.stringify(cleanedDataset, null, 2), "utf8");
fs.writeFileSync(migrationMapPath, JSON.stringify(migrationMap, null, 2), "utf8");

console.log("Successfully migrated sheets.json to dsavis format!");
console.log(`Saved ${Object.keys(migrationMap).length} key mappings to id_migration_map.json`);
for (const [sheetKey, slugs] of sheetSlugs.entries()) {
  console.log(`Sheet ${sheetKey}: ${slugs.size} unique problem slugs`);
}
