import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = path.resolve("outputs", "striver_sheet_archive_2026-07-29");

const SHEETS = [
  {
    key: "SDE",
    url: "https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems",
  },
  {
    key: "A2Z",
    url: "https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z",
  },
];

function extractBalancedJson(text, marker, open = "[", close = "]") {
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Could not find marker: ${marker}`);
  }

  const start = text.indexOf(open, markerIndex + marker.length);
  if (start < 0) {
    throw new Error(`Could not find ${open} after marker: ${marker}`);
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === open) {
      depth += 1;
    } else if (character === close) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  throw new Error(`Unbalanced JSON after marker: ${marker}`);
}

function extractRscPayload(html) {
  const chunks = [];
  const scriptPattern = /<script[^>]*>self\.__next_f\.push\((.*?)\)<\/script>/gs;

  for (const match of html.matchAll(scriptPattern)) {
    try {
      const payload = JSON.parse(match[1]);
      if (payload[0] === 1 && typeof payload[1] === "string") {
        chunks.push(payload[1]);
      }
    } catch {
      // Ignore bootstrap scripts that are not JSON arrays of streamed text.
    }
  }

  if (chunks.length === 0) {
    throw new Error("No streamed Next.js data chunks were found");
  }
  return chunks.join("");
}

function extractStringProperty(text, property) {
  const pattern = new RegExp(`"${property}":"((?:\\\\.|[^"\\\\])*)"`);
  const match = pattern.exec(text);
  return match ? JSON.parse(`"${match[1]}"`) : "";
}

function cleanUrl(value, baseUrl) {
  if (!value || value === "$undefined") return "";
  if (value.startsWith("/")) return new URL(value, baseUrl).href;
  return value;
}

function classifyPlatform(url) {
  if (!url) return "No official practice link";
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "Other";
  }

  if (host.includes("leetcode.com")) return "LeetCode";
  if (host.includes("geeksforgeeks.org")) return "GeeksforGeeks";
  if (host.includes("codingninjas.com") || host.includes("naukri.com")) return "Coding Ninjas / Code360";
  if (host.includes("interviewbit.com")) return "InterviewBit";
  if (host.includes("hackerrank.com")) return "HackerRank";
  if (host.includes("takeuforward.org")) return "takeUforward";
  return host || "Other";
}

function youtubeVideoId(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.split("/").filter(Boolean)[0] || "";
    if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v") || "";
  } catch {
    return "";
  }
  return "";
}

function normalizeDifficulty(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "medium") return "Medium";
  if (normalized === "hard") return "Hard";
  return value || "";
}

function flattenSheet(sheetConfig, metadata, sections) {
  const rows = [];
  let globalNumber = 0;

  sections.forEach((section, sectionIndex) => {
    const subcategories = Array.isArray(section.subcategories)
      ? section.subcategories
      : [
          {
            subcategory_id: "",
            subcategory_name: section.category_name,
            problems: section.problems || [],
          },
        ];

    let sectionProblemNumber = 0;
    subcategories.forEach((subcategory, subtopicIndex) => {
      (subcategory.problems || []).forEach((problem, problemIndex) => {
        globalNumber += 1;
        sectionProblemNumber += 1;

        const externalPracticeUrl = cleanUrl(problem.leetcode, sheetConfig.url)
          || cleanUrl(problem.link, sheetConfig.url);
        const plusUrl = cleanUrl(problem.plus, sheetConfig.url);
        const primaryPracticeUrl = externalPracticeUrl || plusUrl;
        const videoUrl = cleanUrl(problem.youtube, sheetConfig.url);

        rows.push({
          sheet: sheetConfig.key,
          sheet_title: metadata.title,
          sheet_last_updated: metadata.lastUpdated,
          source_url: sheetConfig.url,
          number: globalNumber,
          section_number: sectionIndex + 1,
          section_id: String(section.category_id || ""),
          section_name: section.category_name || "",
          subtopic_number: subtopicIndex + 1,
          subtopic_id: String(subcategory.subcategory_id || ""),
          subtopic_name: subcategory.subcategory_name || section.category_name || "",
          section_problem_number: sectionProblemNumber,
          subtopic_problem_number: problemIndex + 1,
          problem_id: String(problem.problem_id || ""),
          problem_name: problem.problem_name || "",
          difficulty: normalizeDifficulty(problem.difficulty),
          platform: classifyPlatform(primaryPracticeUrl),
          practice_url: primaryPracticeUrl,
          external_practice_url: externalPracticeUrl,
          youtube_url: videoUrl,
          youtube_video_id: youtubeVideoId(videoUrl),
          article_url: cleanUrl(problem.article, sheetConfig.url),
          tuf_plus_url: plusUrl,
          editorial_url: cleanUrl(problem.editorial, sheetConfig.url),
        });
      });
    });
  });

  return rows;
}

async function scrapeSheet(sheetConfig) {
  const response = await fetch(sheetConfig.url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; personal-offline-study-archive/1.0)",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`${sheetConfig.key} page returned HTTP ${response.status}`);
  }

  const html = await response.text();
  const rscText = extractRscPayload(html);
  const sectionsText = extractBalancedJson(rscText, '"sections":');
  const sections = JSON.parse(sectionsText);
  const metadata = {
    title: extractStringProperty(rscText, "title"),
    description: extractStringProperty(rscText, "description"),
    lastUpdated: extractStringProperty(rscText, "lastUpdated"),
  };
  const rows = flattenSheet(sheetConfig, metadata, sections);

  return {
    key: sheetConfig.key,
    url: sheetConfig.url,
    metadata,
    sections,
    rows,
  };
}

await fs.mkdir(OUTPUT_DIR, { recursive: true });
const scrapedSheets = [];
for (const sheetConfig of SHEETS) {
  scrapedSheets.push(await scrapeSheet(sheetConfig));
}

const archive = {
  scraped_at: new Date().toISOString(),
  sheets: scrapedSheets.map(({ key, url, metadata, rows, sections }) => ({
    key,
    url,
    metadata,
    section_count: sections.length,
    row_count: rows.length,
    rows,
  })),
};

await fs.writeFile(
  path.join(OUTPUT_DIR, "striver_sheets_source.json"),
  `${JSON.stringify(archive, null, 2)}\n`,
  "utf8",
);

for (const sheet of archive.sheets) {
  const withVideo = sheet.rows.filter((row) => row.youtube_url).length;
  const withExternalPractice = sheet.rows.filter((row) => row.external_practice_url).length;
  const platformCounts = Object.entries(
    sheet.rows.reduce((counts, row) => {
      counts[row.platform] = (counts[row.platform] || 0) + 1;
      return counts;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  console.log(JSON.stringify({
    sheet: sheet.key,
    title: sheet.metadata.title,
    lastUpdated: sheet.metadata.lastUpdated,
    sections: sheet.section_count,
    problems: sheet.row_count,
    withVideo,
    withExternalPractice,
    platformCounts,
  }));
}
