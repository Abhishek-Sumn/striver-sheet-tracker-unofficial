import fs from "node:fs/promises";
import path from "node:path";

const ARCHIVE_URL = "https://web.archive.org/web/20251222191954/https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z";

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
      // Ignore non-string payloads
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

function cleanUrl(value) {
  if (!value || value === "$undefined") return "";
  let url = String(value);
  if (url.includes("/web/")) {
    const parts = url.split("takeuforward.org");
    if (parts.length > 1) {
      url = "https://takeuforward.org" + parts.slice(1).join("takeuforward.org");
    }
  }
  if (url.startsWith("/")) return new URL(url, "https://takeuforward.org").href;
  return url;
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
  return "Easy";
}

async function run() {
  console.log("Fetching from archive:", ARCHIVE_URL);
  const res = await fetch(ARCHIVE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  const html = await res.text();
  const rscText = extractRscPayload(html);
  const sectionsText = extractBalancedJson(rscText, '"sections":');
  const sections = JSON.parse(sectionsText);

  const metadata = {
    title: extractStringProperty(rscText, "title") || "Striver's A2Z Sheet - Learn DSA from A to Z",
    description: extractStringProperty(rscText, "description") || "This course is made for people who want to learn DSA from A to Z for free in a well-organised and structured manner.",
    lastUpdated: extractStringProperty(rscText, "lastUpdated") || "December 13, 2025",
  };

  const rows = [];
  let globalNumber = 0;
  const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };

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

        const externalPracticeUrl = cleanUrl(problem.leetcode || problem.link || "");
        const plusUrl = cleanUrl(problem.plus || "");
        const primaryPracticeUrl = externalPracticeUrl || plusUrl;
        const videoUrl = cleanUrl(problem.youtube || "");
        const diff = normalizeDifficulty(problem.difficulty);
        difficultyCounts[diff] = (difficultyCounts[diff] || 0) + 1;

        rows.push({
          sheet: "A2Z",
          sheet_title: metadata.title,
          sheet_last_updated: metadata.lastUpdated,
          source_url: "https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z",
          number: globalNumber,
          section_number: sectionIndex + 1,
          section_id: String(section.category_id || ""),
          section_name: (section.category_name || "").replace(/\s+/g, " ").trim(),
          subtopic_number: subtopicIndex + 1,
          subtopic_id: String(subcategory.subcategory_id || ""),
          subtopic_name: (subcategory.subcategory_name || section.category_name || "").replace(/\s+/g, " ").trim(),
          section_problem_number: sectionProblemNumber,
          subtopic_problem_number: problemIndex + 1,
          problem_id: String(problem.problem_id || `a2z_${globalNumber}`),
          problem_name: (problem.problem_name || "").replace(/\s+/g, " ").trim(),
          difficulty: diff,
          platform: classifyPlatform(primaryPracticeUrl),
          practice_url: primaryPracticeUrl,
          external_practice_url: externalPracticeUrl,
          youtube_url: videoUrl,
          youtube_video_id: youtubeVideoId(videoUrl),
          article_url: cleanUrl(problem.article || ""),
          tuf_plus_url: plusUrl,
          editorial_url: cleanUrl(problem.editorial || ""),
        });
      });
    });
  });

  console.log("Total A2Z problems:", rows.length);
  console.log("Difficulty counts:", difficultyCounts);
  console.log("Sections count:", sections.length);
  sections.forEach((sec, idx) => {
    const count = sec.subcategories?.reduce((acc, sub) => acc + (sub.problems?.length || 0), 0) || (sec.problems?.length || 0);
    console.log(`Sec ${idx + 1}: ${sec.category_name} -> ${count} problems`);
  });

  // Save the scraped archive to outputs and update src/data/sheets.json
  const sheetsJsonPath = path.resolve("src", "data", "sheets.json");
  const existingRaw = JSON.parse(await fs.readFile(sheetsJsonPath, "utf8"));
  
  // Update the A2Z sheet inside existing sheets data, or create it if not present
  const a2zSheetData = {
    key: "A2Z",
    url: "https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z",
    metadata,
    section_count: sections.length,
    row_count: rows.length,
    rows,
  };

  const sheetIndex = existingRaw.sheets.findIndex((s) => s.key === "A2Z");
  if (sheetIndex >= 0) {
    existingRaw.sheets[sheetIndex] = a2zSheetData;
  } else {
    existingRaw.sheets.push(a2zSheetData);
  }

  await fs.writeFile(sheetsJsonPath, JSON.stringify(existingRaw, null, 2), "utf8");
  console.log("Updated src/data/sheets.json with", rows.length, "A2Z problems from web archive!");
}

run().catch(console.error);
