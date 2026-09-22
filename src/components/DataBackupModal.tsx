"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  AlertTriangle,
  FileJson,
  RotateCcw,
} from "lucide-react";
import { ImportResult } from "../lib/storage/types";
import { ThemeMode } from "../hooks/useTheme";

interface DataBackupModalProps {
  isOpen: boolean;
  theme?: ThemeMode;
  onClose: () => void;
  onExport: () => Promise<string>;
  onImport: (jsonString: string, mode?: "merge" | "replace") => Promise<ImportResult>;
  onReset: () => Promise<void>;
  totalSolved: number;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  theme = "orange",
  onClose,
  onExport,
  onImport,
  onReset,
  totalSolved,
}) => {
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isOrange = theme === "orange";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      setImportStatus({ type: null, message: "" });
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadFile = async () => {
    const dataStr = await onExport();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split("T")[0];
    const a = document.createElement("a");
    a.href = url;
    a.download = `dsa_tracker_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = async () => {
    const dataStr = await onExport();
    await navigator.clipboard.writeText(dataStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setImportStatus({
        type: "error",
        message: "File exceeds 5MB size limit. Please select a valid DSA Tracker backup.",
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await onImport(content, importMode);
      if (res.success) {
        setImportStatus({
          type: "success",
          message: `Successfully imported progress! ${res.importedCount} solved questions active (${importMode} mode).`,
        });
      } else {
        setImportStatus({
          type: "error",
          message: res.error || "Failed to import file.",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleTextImport = async () => {
    if (!importText.trim()) return;
    const res = await onImport(importText, importMode);
    if (res.success) {
      setImportStatus({
        type: "success",
        message: `Successfully imported progress! ${res.importedCount} solved questions active (${importMode} mode).`,
      });
      setImportText("");
    } else {
      setImportStatus({
        type: "error",
        message: res.error || "Failed to import JSON data.",
      });
    }
  };

  const handleResetExecute = async () => {
    await onReset();
    setShowResetConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal */}
      <div className={`relative z-10 w-full max-w-lg overflow-hidden rounded-xl border p-5 sm:p-6 shadow-2xl ${
        isOrange ? "border-orange-950 bg-black" : "border-zinc-800 bg-zinc-950"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
              isOrange ? "border-orange-500/40 bg-orange-500/10 text-orange-400" : "border-zinc-800 bg-zinc-900 text-zinc-300"
            }`}>
              <FileJson className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Data Backup & Restore</h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                Export or restore your solved questions, notes, and streak.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Message */}
        {importStatus.type && (
          <div
            className={`mt-3.5 rounded-lg border p-3 text-xs sm:text-sm ${
              importStatus.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            {importStatus.message}
          </div>
        )}

        {/* Section 1: Export */}
        <div className="mt-4 space-y-2.5">
          <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Export Progress ({totalSolved} Solved)
          </h4>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleDownloadFile}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                isOrange
                  ? "bg-orange-500 text-black hover:bg-orange-400 shadow-sm"
                  : "bg-zinc-100 text-zinc-950 hover:bg-white"
              }`}
            >
              <Download className="h-4 w-4" />
              <span>Download JSON</span>
            </button>

            <button
              onClick={handleCopyClipboard}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs sm:text-sm font-medium text-zinc-200 hover:bg-zinc-850 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 2: Import */}
        <div className="mt-5 space-y-3 border-t border-zinc-850 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Restore Data
            </h4>
            <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setImportMode("merge")}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  importMode === "merge"
                    ? isOrange ? "bg-orange-500 text-black font-bold" : "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Merge
              </button>
              <button
                type="button"
                onClick={() => setImportMode("replace")}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  importMode === "replace"
                    ? isOrange ? "bg-orange-500 text-black font-bold" : "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Replace
              </button>
            </div>
          </div>

          <div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-750 bg-zinc-900/40 p-3 text-xs sm:text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white">
              <Upload className="h-4 w-4 text-orange-400" />
              <span>Select backup file (.json)</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-2">
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Or paste backup JSON here..."
              rows={2}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 font-mono text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
            {importText && (
              <button
                onClick={handleTextImport}
                className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${
                  isOrange
                    ? "bg-orange-500 text-black hover:bg-orange-400"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                }`}
              >
                Import Pasted Data
              </button>
            )}
          </div>
        </div>

        {/* Section 3: Reset Safeguard */}
        <div className="mt-5 border-t border-zinc-850 pt-4">
          {!showResetConfirm ? (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-zinc-400">Need a clean slate?</span>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs sm:text-sm text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset All Progress</span>
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-sm font-semibold text-rose-200">Confirm Reset</h5>
                  <p className="mt-0.5 text-xs sm:text-sm text-rose-300/80">
                    This will erase all marked problems, bookmarks, notes, and streak from your browser.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={handleResetExecute}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs sm:text-sm font-bold text-white hover:bg-rose-500 transition-colors"
                    >
                      Yes, Reset Everything
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="rounded-lg border border-zinc-750 bg-zinc-850 px-3 py-1.5 text-xs sm:text-sm text-zinc-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
