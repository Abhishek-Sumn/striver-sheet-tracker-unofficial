"use client";

import React, { useEffect } from "react";
import { X, ExternalLink, BookOpen, Video } from "lucide-react";
import { LeetCodeIcon } from "./LeetCodeIcon";
import { ProblemRow } from "../types/sheet";
import { getDifficultyColor, isAllowedPracticeUrl, isAllowedArticleUrl } from "../lib/utils";
import { ThemeMode } from "../hooks/useTheme";

interface VideoModalProps {
  problem: ProblemRow | null;
  theme?: ThemeMode;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ problem, theme = "orange", onClose }) => {
  const isOrange = theme === "orange";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (problem) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [problem, onClose]);

  if (!problem) return null;

  let videoId = problem.youtube_video_id;
  if (!videoId && problem.youtube_url) {
    const match = problem.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) videoId = match[1];
  }

  const diff = getDifficultyColor(problem.difficulty);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Dark overlay backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div className={`relative z-10 w-full max-w-4xl overflow-hidden rounded-xl border shadow-2xl ${
        isOrange ? "border-orange-950 bg-black" : "border-zinc-800 bg-zinc-950"
      }`}>
        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${
          isOrange ? "border-orange-950 bg-black" : "border-zinc-800 bg-zinc-950"
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              isOrange ? "border-orange-500/40 bg-orange-500/10 text-orange-400" : "border-zinc-800 bg-zinc-900 text-zinc-300"
            }`}>
              <Video className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm text-zinc-400 font-medium">
                  #{String(problem.number).padStart(3, "0")}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {problem.problem_name}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${diff.badge}`}
                >
                  {problem.difficulty}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">
                {problem.sheet} Sheet • {problem.section_name} • Video by{" "}
                <a
                  href="https://www.youtube.com/@takeUforward"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-300 hover:text-white underline transition-colors"
                >
                  takeUforward
                </a>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video Player Frame */}
        <div className="relative aspect-video w-full bg-black">
          {videoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={`Video - ${problem.problem_name}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-zinc-400">
              <p className="text-sm sm:text-base font-medium">Video player could not load directly.</p>
              <a
                href={problem.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-3 flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                  isOrange
                    ? "bg-orange-500 text-black hover:bg-orange-400"
                    : "border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-850"
                }`}
              >
                <span>Open on YouTube</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        {/* Footer info & quick links */}
        <div className={`flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs sm:text-sm ${
          isOrange ? "border-orange-950 bg-black" : "border-zinc-800 bg-zinc-950"
        }`}>
          <div className="text-zinc-400 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
            <span>Video walkthrough • Video by</span>
            <a
              href="https://www.youtube.com/@takeUforward"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-white underline transition-colors"
            >
              takeUforward
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            {problem.youtube_url && (
              <a
                href={problem.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-200 hover:bg-zinc-850 hover:text-white transition-colors"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
              </a>
            )}

            {isAllowedArticleUrl(problem.editorial_url) && (
              <a
                href={problem.editorial_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-200 hover:bg-zinc-850 hover:text-white transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                <span>Editorial</span>
              </a>
            )}

            {isAllowedPracticeUrl(problem.external_practice_url) && (
              <a
                href={problem.external_practice_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                  isOrange
                    ? "bg-orange-500 text-black hover:bg-orange-400 shadow-sm shadow-orange-500/20"
                    : "bg-zinc-100 text-zinc-950 hover:bg-white"
                }`}
              >
                <LeetCodeIcon className="h-4 w-4" monochrome={true} />
                <span>Practice {problem.platform ? `on ${problem.platform}` : "on LeetCode"}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
