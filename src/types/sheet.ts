export type SheetKey = "SDE" | "A2Z";
export type DifficultyLevel = "Easy" | "Medium" | "Hard";
export type StatusFilter =
  | "ALL"
  | "solved"
  | "unsolved"
  | "bookmarked"
  | "has_notes"
  | "confidence_hard"
  | "confidence_medium"
  | "confidence_easy";
export type DifficultyFilter = "ALL" | "Easy" | "Medium" | "Hard";
export type PlatformFilter = "ALL" | "LeetCode" | "other";
export type ViewMode = "accordion" | "table";

export interface ProblemRow {
  sheet: SheetKey;
  id: string;
  slug: string;
  number: number;
  section_number: number;
  section_name: string;
  subtopic_number: number;
  subtopic_name: string;
  section_problem_number: number;
  subtopic_problem_number: number;
  problem_name: string;
  difficulty: DifficultyLevel;
  platform: string;
  practice_url: string;
  external_practice_url: string;
  youtube_url: string;
  youtube_video_id: string;
  article_url: string;
  resource_url?: string;
  editorial_url: string;
}

export interface SheetMetadata {
  title: string;
  tagline?: string;
  description: string;
}

export interface SheetData {
  key: SheetKey;
  url: string;
  metadata: SheetMetadata;
  section_count: number;
  row_count: number;
  rows: ProblemRow[];
}

export interface SheetArchive {
  scraped_at: string;
  sheets: SheetData[];
}

export interface SubtopicGroup {
  subtopic_number: number;
  subtopic_name: string;
  problems: ProblemRow[];
}

export interface SectionGroup {
  section_number: number;
  section_name: string;
  sheet: SheetKey;
  subtopics: SubtopicGroup[];
  totalProblems: number;
}

export interface FilterState {
  sheet: "ALL" | SheetKey;
  searchQuery: string;
  difficulty: DifficultyFilter;
  status: StatusFilter;
  platform: PlatformFilter;
  hasVideoOnly: boolean;
  viewMode: ViewMode;
}
