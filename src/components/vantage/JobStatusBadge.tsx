"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAnalysisJobContext } from "@/components/vantage/AnalysisJobProvider";

/**
 * A small, always-there status box for the analysis job. Shown on every dashboard
 * page except /dashboard/new itself (which already has the full processing screen),
 * so leaving that page mid-analysis never looks like the run stopped — it is still
 * going in the background, and clicking this takes you back to watch it finish.
 */
export function JobStatusBadge() {
  const job = useAnalysisJobContext();
  const pathname = usePathname();

  if (!job.isRunning || pathname === "/dashboard/new") return null;

  return (
    <Link
      href="/dashboard/new"
      className="fixed top-[76px] right-4 z-50 flex items-center gap-2.5 rounded-[11px] border border-brand/30 bg-ink-700/95 px-3.5 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.5)] backdrop-blur transition-colors hover:border-brand/55 sm:right-6"
    >
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand" />
      <div className="min-w-0 text-left">
        <div className="text-[12px] font-bold text-ink-100">Analyzing your match…</div>
        <div className="font-mono-num text-[11px] text-mute-3">
          {Math.round(job.percent)}% complete
        </div>
      </div>
    </Link>
  );
}
