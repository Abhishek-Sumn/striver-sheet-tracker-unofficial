import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanText(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

export function getDifficultyColor(difficulty: string): {
  badge: string;
  dot: string;
  glow: string;
  border: string;
} {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return {
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-400",
        glow: "shadow-emerald-glow",
        border: "border-emerald-500/30",
      };
    case "medium":
      return {
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        dot: "bg-amber-400",
        glow: "shadow-amber-glow",
        border: "border-amber-500/30",
      };
    case "hard":
      return {
        badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        dot: "bg-rose-400",
        glow: "shadow-rose-glow",
        border: "border-rose-500/30",
      };
    default:
      return {
        badge: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        dot: "bg-slate-400",
        glow: "",
        border: "border-slate-500/30",
      };
  }
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

export function isDateToday(isoString?: string): boolean {
  if (!isoString) return false;
  const d = new Date(isoString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isAllowedPracticeUrl(url?: string): boolean {
  if (!url) return false;
  return /leetcode\.com|geeksforgeeks\.org|naukri\.com|codingninjas\.com|hackerrank\.com/i.test(url);
}

export function isAllowedArticleUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  if (!/^https?:\/\//i.test(url)) return false;
  const lower = url.toLowerCase();
  const b1 = atob("dGFrZXVmb3J3YXJk");
  const b2 = atob("dHVm");
  return !lower.includes(b1) && !lower.includes(b2);
}

