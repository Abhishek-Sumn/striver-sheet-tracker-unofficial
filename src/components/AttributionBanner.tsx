import React from "react";
import { ExternalLink } from "lucide-react";
import { SITE_CONFIG } from "../lib/site";

export const AttributionBanner: React.FC = () => {
  return (
    <div className="w-full bg-[#141416] border-b border-zinc-800/80 px-3 py-1.5 text-center text-xs text-zinc-400 z-50">
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-1.5 flex-wrap">
        <span>
          Unofficial tracker. The sheet, its order and problem selection are the work of Striver / takeUforward — visit
        </span>
        <a
          href={SITE_CONFIG.takeuforwardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors"
        >
          <span>takeuforward.org</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
