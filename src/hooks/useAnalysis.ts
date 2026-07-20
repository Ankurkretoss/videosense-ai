import { useState, useCallback } from "react";
import type { VideoAnalysis, AnalysisStatus, UploadProgress } from "@/types/analysis";
import { analyzeVideo, analyzeYouTubeVideo } from "@/lib/ai";
import { ANALYSIS_STAGES } from "@/lib/constants";

interface AnalysisState {
  status: AnalysisStatus;
  progress: UploadProgress;
  result: VideoAnalysis | null;
  error: string | null;
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    status: "idle",
    progress: { status: "idle", progress: 0, message: "" },
    result: null,
    error: null,
  });

  const analyze = useCallback(async (file: File | null, youtubeUrl: string) => {
    setState({
      status: "uploading",
      progress: { status: "uploading", progress: 0, message: "Uploading video..." },
      result: null,
      error: null,
    });

    try {
      for (let i = 0; i < ANALYSIS_STAGES.length; i++) {
        const stage = ANALYSIS_STAGES[i];
        const progress = ((i + 1) / ANALYSIS_STAGES.length) * 100;

        setState((prev) => ({
          ...prev,
          status: stage.status,
          progress: { status: stage.status, progress, message: stage.message },
        }));

        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      let result: VideoAnalysis;

      if (file) {
        result = await analyzeVideo(file);
      } else if (youtubeUrl) {
        result = await analyzeYouTubeVideo(youtubeUrl);
      } else {
        throw new Error("No video source provided");
      }

      setState({
        status: "completed",
        progress: { status: "completed", progress: 100, message: "Analysis complete!" },
        result,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setState((prev) => ({
        ...prev,
        status: "error",
        error: message,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      status: "idle",
      progress: { status: "idle", progress: 0, message: "" },
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyze,
    reset,
    isAnalyzing: state.status !== "idle" && state.status !== "completed" && state.status !== "error",
  };
}
