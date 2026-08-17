import { useCallback, useEffect, useRef, useState } from "react";
import { saveAnalysis, type AnalysisSourceType } from "@/lib/analysis-store";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { SportsAnalysis } from "@/types/sports-analysis";

export type ArchiveStatus = "idle" | "saving" | "saved" | "error" | "unconfigured";

export interface AnalysisArchiveState {
  status: ArchiveStatus;
  savedId: string | null;
  error: string | null;
  save: () => void;
}

/**
 * Pushes a finished report into Firestore automatically, so every analysed video
 * lands in the library without the user having to do anything.
 */
export function useAnalysisArchive(
  analysis: SportsAnalysis | null,
  sourceType: AnalysisSourceType
): AnalysisArchiveState {
  const [status, setStatus] = useState<ArchiveStatus>("idle");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savedFor = useRef<SportsAnalysis | null>(null);

  const persist = useCallback(
    async (report: SportsAnalysis) => {
      if (!isFirebaseConfigured()) {
        setStatus("unconfigured");
        return;
      }

      setStatus("saving");
      setError(null);
      try {
        const stored = await saveAnalysis({ analysis: report, sourceType });
        setSavedId(stored.id);
        setStatus("saved");
      } catch (err) {
        savedFor.current = null;
        setError(err instanceof Error ? err.message : "Could not save this analysis.");
        setStatus("error");
      }
    },
    [sourceType]
  );

  useEffect(() => {
    if (!analysis || savedFor.current === analysis) return;
    savedFor.current = analysis;
    void persist(analysis);
  }, [analysis, persist]);

  const save = useCallback(() => {
    if (!analysis) return;
    savedFor.current = analysis;
    void persist(analysis);
  }, [analysis, persist]);

  return { status, savedId, error, save };
}
