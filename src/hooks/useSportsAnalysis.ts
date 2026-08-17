import { useCallback, useRef, useState } from "react";
import type { AnalysisStatus, UploadProgress } from "@/types/analysis";
import type { SportsAnalysis } from "@/types/sports-analysis";
import { analyzeSportsVideo, analyzeSportsYouTubeVideo } from "@/lib/ai";

interface SportsAnalysisState {
  status: AnalysisStatus;
  progress: UploadProgress;
  result: SportsAnalysis | null;
  error: string | null;
}

const IDLE_STATE: SportsAnalysisState = {
  status: "idle",
  progress: { status: "idle", progress: 0, message: "" },
  result: null,
  error: null,
};

export function useSportsAnalysis(apiKey: string | null) {
  const [state, setState] = useState<SportsAnalysisState>(IDLE_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(
    async (file: File | null, youtubeUrl: string) => {
      if (!apiKey) {
        setState({ ...IDLE_STATE, status: "error", error: "Gemini API key is not configured." });
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        status: "uploading",
        progress: { status: "uploading", progress: 1, message: "Preparing match footage..." },
        result: null,
        error: null,
      });

      const options = {
        signal: controller.signal,
        onProgress: ({ stage, progress, message }: { stage: AnalysisStatus; progress: number; message: string }) =>
          setState((prev) => ({
            ...prev,
            status: stage,
            progress: { status: stage, progress: Math.round(progress), message },
          })),
      };

      try {
        const result = file
          ? await analyzeSportsVideo(file, apiKey, options)
          : youtubeUrl
            ? await analyzeSportsYouTubeVideo(youtubeUrl, apiKey, options)
            : null;

        if (!result) throw new Error("No video source provided");

        setState({
          status: "completed",
          progress: { status: "completed", progress: 100, message: "Match report ready." },
          result,
          error: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        setState((prev) => ({
          ...prev,
          status: "error",
          error: controller.signal.aborted ? "Analysis cancelled." : message,
        }));
      } finally {
        abortRef.current = null;
      }
    },
    [apiKey]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(IDLE_STATE);
  }, []);

  return {
    ...state,
    analyze,
    cancel,
    reset,
    isAnalyzing:
      state.status !== "idle" && state.status !== "completed" && state.status !== "error",
  };
}
