"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAnalysisJobContext } from "@/components/vantage/AnalysisJobProvider";
import { ProgressBar } from "@/components/vantage/ui";

/**
 * A hard-to-miss status card for the analysis job. Shown on every dashboard page
 * except /dashboard/new itself (which already has the full processing screen), so
 * leaving that page mid-analysis never looks like the run stopped — it is still
 * going in the background, and clicking this takes you back to watch it finish.
 */
export function JobStatusBadge() {
  const job = useAnalysisJobContext();
  const pathname = usePathname();

  if (!job.isRunning || pathname === "/dashboard/new") return null;

  return (
    <Link
      href="/dashboard/new"
      className="animate-glow fixed top-[76px] right-4 z-50 block w-[248px] rounded-[13px] border border-brand/60 bg-ink-700 p-3.5 backdrop-blur transition-transform hover:-translate-y-0.5 hover:border-brand sm:right-6"
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-bold text-ink-100">Analyzing your match…</div>
          <div className="font-mono-num text-[11px] text-brand-soft">running in the background</div>
        </div>
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand" />
      </div>

      <ProgressBar value={job.percent} className="mt-3" />
      <div className="font-mono-num mt-1.5 flex items-center justify-between text-[10.5px] text-mute-3">
        <span>{Math.round(job.percent)}% complete</span>
        <span className="text-brand-soft">View progress →</span>
      </div>
    </Link>
  );
}
