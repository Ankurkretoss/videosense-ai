"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, CloudUpload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisArchiveState } from "@/hooks/useAnalysisArchive";

export function ArchiveBanner({ archive }: { archive: AnalysisArchiveState }) {
  if (archive.status === "idle") return null;

  if (archive.status === "saving") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
        Saving this analysis to your library...
      </div>
    );
  }

  if (archive.status === "saved") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-200/90">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        Saved to your library — every detail of this match is stored.
        <Link href="/library" className="ml-auto">
          <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white">
            <CloudUpload className="h-3.5 w-3.5" />
            Open library
          </Button>
        </Link>
      </div>
    );
  }

  if (archive.status === "unconfigured") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-200/80">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <span>
          Firebase is not configured, so this report is not being saved. Add the{" "}
          <code className="rounded bg-white/10 px-1 py-0.5">NEXT_PUBLIC_FIREBASE_*</code> values to{" "}
          <code className="rounded bg-white/10 px-1 py-0.5">.env.local</code> and re-run the
          analysis.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
      <AlertCircle className="h-4 w-4 text-red-400" />
      <span className="min-w-0 flex-1">Could not save to the library: {archive.error}</span>
      <Button
        size="sm"
        variant="outline"
        className="border-white/10 bg-white/5 text-white"
        onClick={archive.save}
      >
        Retry
      </Button>
    </div>
  );
}
