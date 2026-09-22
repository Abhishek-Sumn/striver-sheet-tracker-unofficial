"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Save,
  FileText,
  Check,
  Trash2,
  Copy,
  ExternalLink,
  Play,
  Star,
  Eye,
  Edit3,
  Bold,
  Italic,
  Heading2,
  Code,
  List,
  CheckSquare,
  Clock,
  Sparkles,
  ChevronDown,
  Quote,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ProblemRow } from "../types/sheet";
import { ConfidenceRating } from "../lib/storage/types";
import { getDifficultyColor, isAllowedPracticeUrl, isAllowedArticleUrl } from "../lib/utils";
import { ThemeMode } from "../hooks/useTheme";

interface NotesDrawerProps {
  problem: ProblemRow | null;
  initialNotes: string;
  theme?: ThemeMode;
  isBookmarked?: boolean;
  confidence?: ConfidenceRating;
  onSave: (sheet: string, problemId: string, notes: string) => void;
  onToggleBookmarked?: (sheet: string, problemId: string) => void;
  onSetConfidence?: (
    sheet: string,
    problemId: string,
    confidence: ConfidenceRating | null
  ) => void;
  onClose: () => void;
}

// Built-in DSA Interview Prep Templates
const TEMPLATES = [
  {
    id: "faang",
    name: "Full Interview Breakdown",
    content: `### 💡 Core Intuition & Pattern
- **Pattern**: 
- **Key Insight**: 
- **Why this works**: 

### ⚡ Approaches
1. **Brute Force**: O(...) Time, O(...) Space
2. **Optimal**: O(...) Time, O(...) Space

### 🛠️ Algorithm Steps
1. 
2. 
3. 

### ⚠️ Edge Cases & Pitfalls
- [ ] Empty or single-element input
- [ ] Duplicates and 0s
- [ ] Negative values
- [ ] Integer overflow / boundary constraints

### ⏱️ Complexity Analysis
- **Time Complexity**: \`O(N)\`
- **Space Complexity**: \`O(1)\`

### 💻 Solution
\`\`\`cpp
// Optimal solution
\`\`\``,
  },
  {
    id: "quick",
    name: "1-Min Revision Card",
    content: `### 🎯 1-Minute Takeaway
- **The "Aha!" moment**: 
- **Time**: \`O(N)\` | **Space**: \`O(1)\`
- **Watch out for**: `,
  },
  {
    id: "pattern",
    name: "Pattern & Clues",
    content: `### 🔍 Pattern Identification
- **Signal in problem statement**: 
- **Primary Data Structure**: 
- **Similar Problems**:
  - [ ] Similar Problem 1
  - [ ] Similar Problem 2`,
  },
];

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  problem,
  initialNotes,
  theme = "orange",
  isBookmarked = false,
  confidence,
  onSave,
  onToggleBookmarked,
  onSetConfidence,
  onClose,
}) => {
  const [content, setContent] = useState(initialNotes);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "split">("edit");
  const [justSaved, setJustSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const isOrange = theme === "orange";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentKey = problem ? `${problem.sheet}:${problem.id}` : null;
  const lastProblemKeyRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(initialNotes);

  useEffect(() => {
    if (currentKey && currentKey !== lastProblemKeyRef.current) {
      lastProblemKeyRef.current = currentKey;
      setContent(initialNotes);
      contentRef.current = initialNotes;
      setShowVideo(false);
    }
  }, [currentKey, initialNotes]);

  const flushSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (problem) {
      onSave(problem.sheet, problem.id, contentRef.current);
    }
  }, [problem, onSave]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    flushSave();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        flushSave();
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }
      // Ctrl/Cmd + E to toggle edit/preview
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        setActiveTab((prev) => (prev === "edit" ? "preview" : "edit"));
      }
    };
    if (problem) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [problem, onClose, flushSave]);

  if (!problem) return null;

  const handleContentChange = (val: string) => {
    setContent(val);
    contentRef.current = val;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (problem) {
        onSave(problem.sheet, problem.id, val);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }
    }, 400);
  };

  // Helper to insert formatting around selected text
  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || placeholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newText = text.substring(0, start) + replacement + text.substring(end);
    handleContentChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 10);
  };

  // Tab key support in textarea (2 spaces)
  const handleKeyDownInTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = content.substring(0, start) + "  " + content.substring(end);
      handleContentChange(newText);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleCopyNotes = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const diff = getDifficultyColor(problem.difficulty);
  
  const rawPractice = problem.external_practice_url || problem.practice_url;
  const practiceUrl = isAllowedPracticeUrl(rawPractice) ? rawPractice : null;
  const displayPlatform = problem.platform && isAllowedPracticeUrl(rawPractice) ? problem.platform : "Practice";
  const articleUrl = isAllowedArticleUrl(problem.article_url) ? problem.article_url : null;

  // Video embed URL
  const videoEmbedUrl = problem.youtube_video_id
    ? `https://www.youtube-nocookie.com/embed/${problem.youtube_video_id}`
    : problem.youtube_url && problem.youtube_url.includes("youtu.be")
    ? `https://www.youtube-nocookie.com/embed/${problem.youtube_url.split("/").pop()?.split("?")[0]}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container */}
      <div
        className={`relative z-10 flex h-full w-full max-w-2xl flex-col border-l shadow-2xl transition-all ${
          isOrange ? "border-[#22242c] bg-[#0c0d10]" : "border-zinc-800 bg-zinc-950"
        }`}
      >
        {/* 1. Header with metadata and quick actions */}
        <div className="flex flex-col gap-3 border-b border-[#20222a] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${
                  isOrange
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300"
                }`}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-400">
                    #{String(problem.number).padStart(3, "0")}
                  </span>
                  <h2 className="truncate text-base sm:text-lg font-bold text-white">
                    {problem.problem_name}
                  </h2>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${diff.badge}`}
                  >
                    {problem.difficulty}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="truncate text-zinc-300">{problem.section_name}</span>
                </div>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onToggleBookmarked && (
                <button
                  onClick={() => onToggleBookmarked(problem.sheet, problem.id)}
                  title={isBookmarked ? "Bookmarked for revision" : "Add to revision"}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                    isBookmarked
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                      : "border-[#252730] bg-[#141519] text-zinc-400 hover:text-white"
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${isBookmarked ? "fill-amber-400" : ""}`}
                  />
                </button>
              )}

              <button
                onClick={handleClose}
                title="Close (Esc)"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#252730] bg-[#141519] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Problem Links & Video Embed Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {practiceUrl && (
                <a
                  href={practiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-[#262832] bg-[#14151a] px-2.5 py-1 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Practice ({displayPlatform})</span>
                </a>
              )}

              {articleUrl && (
                <a
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-[#262832] bg-[#14151a] px-2.5 py-1 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
                >
                  <FileText className="h-3 w-3" />
                  <span>Editorial</span>
                </a>
              )}

              {videoEmbedUrl && (
                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 transition-colors ${
                    showVideo
                      ? "border-red-500/50 bg-red-500/10 text-red-400 font-semibold"
                      : "border-[#262832] bg-[#14151a] text-zinc-300 hover:text-white hover:border-zinc-600"
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>{showVideo ? "Hide Video" : "Watch Video"}</span>
                </button>
              )}
            </div>

            {/* Confidence Selector */}
            {onSetConfidence && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-xs font-medium mr-1">Confidence:</span>
                <button
                  onClick={() =>
                    onSetConfidence(
                      problem.sheet,
                      problem.id,
                      confidence === "hard" ? null : "hard"
                    )
                  }
                  title="Needs Practice"
                  className={`px-2 py-0.5 rounded text-xs font-semibold border transition-all ${
                    confidence === "hard"
                      ? "bg-rose-950/60 text-rose-300 border-rose-600 ring-1 ring-rose-500"
                      : "border-[#262832] bg-[#14151a] text-zinc-400 hover:text-rose-400"
                  }`}
                >
                  Hard
                </button>
                <button
                  onClick={() =>
                    onSetConfidence(
                      problem.sheet,
                      problem.id,
                      confidence === "medium" ? null : "medium"
                    )
                  }
                  title="Getting There"
                  className={`px-2 py-0.5 rounded text-xs font-semibold border transition-all ${
                    confidence === "medium"
                      ? "bg-amber-950/60 text-amber-300 border-amber-600 ring-1 ring-amber-500"
                      : "border-[#262832] bg-[#14151a] text-zinc-400 hover:text-amber-400"
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() =>
                    onSetConfidence(
                      problem.sheet,
                      problem.id,
                      confidence === "easy" ? null : "easy"
                    )
                  }
                  title="Mastered"
                  className={`px-2 py-0.5 rounded text-xs font-semibold border transition-all ${
                    confidence === "easy"
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-600 ring-1 ring-emerald-500"
                      : "border-[#262832] bg-[#14151a] text-zinc-400 hover:text-emerald-400"
                  }`}
                >
                  Easy
                </button>
              </div>
            )}
          </div>

          {/* Embedded Video Player */}
          {showVideo && videoEmbedUrl && (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#2e303b] bg-black shadow-lg animate-in fade-in duration-200">
              <iframe
                src={videoEmbedUrl}
                title={problem.problem_name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </div>

        {/* 2. Markdown Action & Formatting Toolbar */}
        <div className="flex items-center justify-between border-b border-[#20222a] bg-[#101115] px-4 py-2 text-xs">
          {/* Left: View Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-[#272832] bg-[#14151a] p-0.5">
            <button
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "edit"
                  ? "bg-[#252733] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Edit3 className="h-3 w-3" />
              <span>Write</span>
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-[#252733] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>Preview</span>
            </button>
          </div>

          {/* Middle: Formatting shortcuts (visible in write mode) */}
          {activeTab === "edit" && (
            <div className="hidden sm:flex items-center gap-1 text-zinc-400">
              <button
                onClick={() => insertFormatting("**", "**", "bold text")}
                title="Bold (Ctrl+B)"
                className="rounded p-1 hover:bg-[#1f2129] hover:text-white transition-colors"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => insertFormatting("*", "*", "italic text")}
                title="Italic (Ctrl+I)"
                className="rounded p-1 hover:bg-[#1f2129] hover:text-white transition-colors"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => insertFormatting("\n### ", "\n", "Heading")}
                title="Heading"
                className="rounded p-1 hover:bg-[#1f2129] hover:text-white transition-colors"
              >
                <Heading2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => insertFormatting("`", "`", "code")}
                title="Inline Code"
                className="rounded p-1 hover:bg-[#1f2129] hover:text-white transition-colors"
              >
                <Code className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => insertFormatting("\n```cpp\n", "\n```\n", "// Code")}
                title="Code Block"
                className="rounded px-1.5 py-0.5 font-mono text-xs font-bold text-orange-400 hover:bg-[#1f2129] transition-colors"
              >
                {"{ }"}
              </button>
              <button
                onClick={() => insertFormatting("\n- ", "", "list item")}
                title="Bullet List"
                className="rounded p-1 hover:bg-[#1f2129] hover:text-white transition-colors"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => insertFormatting("\n- [ ] ", "", "task")}
                title="Task Checkbox"
                className="rounded p-1 hover:bg-[#1f2129] hover:text-white transition-colors"
              >
                <CheckSquare className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => insertFormatting("\n> ", "", "Important Note")}
                title="Blockquote"
                className="rounded p-1 hover:bg-[#1f2129] hover:text-white transition-colors"
              >
                <Quote className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() =>
                  insertFormatting(
                    "\n- **Time**: `O(N)`\n- **Space**: `O(1)`\n",
                    "",
                    ""
                  )
                }
                title="Insert Complexity Snippet"
                className="rounded p-1 hover:bg-[#1f2129] hover:text-orange-400 transition-colors"
              >
                <Clock className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Right: Templates dropdown */}
          <div className="relative">
            <button
              onClick={() => setTemplatesOpen(!templatesOpen)}
              className="flex items-center gap-1.5 rounded-md border border-[#272832] bg-[#14151a] px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
            >
              <Sparkles className="h-3 w-3 text-orange-400" />
              <span>Templates</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {templatesOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 z-30 w-56 rounded-xl border border-[#2b2d38] bg-[#121317] p-1.5 shadow-2xl"
                onMouseLeave={() => setTemplatesOpen(false)}
              >
                <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Insert FAANG Template
                </div>
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      const next = content
                        ? `${content}\n\n${tmpl.content}`
                        : tmpl.content;
                      handleContentChange(next);
                      setTemplatesOpen(false);
                    }}
                    className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-[#1c1e26] hover:text-white transition-colors"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Editor & Live Markdown Preview Area */}
        <div className="relative flex-1 overflow-hidden">
          {activeTab === "edit" ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDownInTextarea}
              placeholder={`# Write your notes for ${problem.problem_name} here...\n\nSupports Markdown:\n- **Bold**, *Italic*, \`Inline Code\`\n- Code blocks (\`\`\`cpp ... \`\`\`)\n- Checklists (- [ ] item)\n- Big-O complexity analysis\n\nUse Templates above to quick-start!`}
              className="h-full w-full resize-none bg-transparent p-5 font-mono text-sm leading-relaxed text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />
          ) : (
            <div className="h-full w-full overflow-y-auto p-6">
              {content.trim() ? (
                <div className="prose-invert max-w-none text-sm leading-relaxed space-y-3">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-lg font-bold text-white border-b border-[#23252f] pb-2 mt-4 mb-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-bold text-zinc-100 border-b border-[#23252f] pb-1 mt-4 mb-2">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold text-orange-400 mt-3 mb-1">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-zinc-300 text-sm leading-relaxed mb-2.5">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 text-zinc-300 text-sm mb-2.5 ml-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-sm mb-2.5 ml-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-zinc-300 text-sm">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-orange-500 pl-3 py-1 my-2 bg-orange-500/5 text-zinc-300 text-sm italic rounded-r">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3 rounded-lg border border-[#23252f]">
                          <table className="min-w-full text-xs divide-y divide-[#23252f]">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="px-3 py-2 bg-[#14151a] text-zinc-300 font-semibold text-left">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-3 py-2 border-t border-[#23252f] text-zinc-400">
                          {children}
                        </td>
                      ),
                      code: ({ className, children, ...props }) => {
                        const isInline = !className;
                        if (isInline) {
                          return (
                            <code className="rounded bg-[#17181e] px-1.5 py-0.5 font-mono text-sm text-orange-300 border border-[#252631]">
                              {children}
                            </code>
                          );
                        }
                        const lang = className?.replace("language-", "") || "code";
                        const codeStr = String(children).replace(/\n$/, "");
                        return (
                          <div className="relative my-3 rounded-xl border border-[#252733] bg-[#090a0d] overflow-hidden">
                            <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#121318] border-b border-[#23252f] text-xs text-zinc-400">
                              <span className="font-mono uppercase text-xs font-bold text-orange-400">
                                {lang}
                              </span>
                              <button
                                onClick={() => navigator.clipboard.writeText(codeStr)}
                                title="Copy code"
                                className="flex items-center gap-1 hover:text-white transition-colors"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                <span className="text-xs">Copy</span>
                              </button>
                            </div>
                            <pre className="p-3.5 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
                              <code>{children}</code>
                            </pre>
                          </div>
                        );
                      },
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500 text-sm">
                  <FileText className="h-8 w-8 mb-2 opacity-30" />
                  <p>No notes written yet.</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Switch to Write tab or select a template above to get started.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Footer with stats, copy and save buttons */}
        <div className="flex items-center justify-between border-t border-[#20222a] bg-[#0f1014] px-4 sm:px-5 py-3 text-xs">
          {/* Left stats & status */}
          <div className="flex items-center gap-3 text-zinc-400">
            {justSaved ? (
              <span className="flex items-center gap-1 font-semibold text-emerald-400">
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Saved locally</span>
              </span>
            ) : (
              <span className="text-zinc-500 font-medium">Auto-saved to LocalStorage</span>
            )}
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-500 font-mono">{wordCount} words</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {content && (
              <button
                onClick={handleCopyNotes}
                title="Copy all notes to clipboard"
                className="flex items-center gap-1.5 rounded-lg border border-[#272832] bg-[#14151a] px-3 py-1.5 font-medium text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}

            {content && (
              <button
                onClick={() => {
                  if (confirm("Clear notes for this problem?")) {
                    handleContentChange("");
                  }
                }}
                title="Clear notes"
                className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              onClick={() => {
                flushSave();
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[#ff6b00] hover:bg-[#ff7b1a] px-4 py-1.5 font-bold text-white shadow-sm transition-all active:scale-95"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
