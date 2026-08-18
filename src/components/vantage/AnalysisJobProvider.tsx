"use client";

import { createContext, useContext } from "react";
import { useAnalysisJob, type AnalysisJob } from "@/hooks/useAnalysisJob";

/**
 * Holds the one active analysis job at the dashboard-layout level, above the
 * routed pages, so it survives navigation. Leaving /dashboard/new mid-analysis
 * does not cancel the run — the job keeps going and the header shows live
 * progress until it is done.
 */
const AnalysisJobContext = createContext<AnalysisJob | null>(null);

export function AnalysisJobProvider({ children }: { children: React.ReactNode }) {
  const job = useAnalysisJob();
  return <AnalysisJobContext.Provider value={job}>{children}</AnalysisJobContext.Provider>;
}

export function useAnalysisJobContext(): AnalysisJob {
  const job = useContext(AnalysisJobContext);
  if (!job) throw new Error("useAnalysisJobContext must be used inside AnalysisJobProvider.");
  return job;
}
