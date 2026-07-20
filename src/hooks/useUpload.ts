import { useState, useCallback } from "react";
import type { VideoSource } from "@/types/analysis";

interface UploadState {
  file: File | null;
  youtubeUrl: string;
  source: VideoSource | null;
  preview: string | null;
  error: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    file: null,
    youtubeUrl: "",
    source: null,
    preview: null,
    error: null,
  });

  const setFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setState((prev) => ({
      ...prev,
      file,
      source: "file",
      preview: url,
      error: null,
    }));
  }, []);

  const setYoutubeUrl = useCallback((url: string) => {
    setState((prev) => ({
      ...prev,
      youtubeUrl: url,
      source: "youtube",
      file: null,
      preview: null,
      error: null,
    }));
  }, []);

  const clearUpload = useCallback(() => {
    setState((prev) => {
      if (prev.preview) {
        URL.revokeObjectURL(prev.preview);
      }
      return {
        file: null,
        youtubeUrl: "",
        source: null,
        preview: null,
        error: null,
      };
    });
  }, []);

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const hasUpload = state.file !== null || state.youtubeUrl.length > 0;

  return {
    ...state,
    setFile,
    setYoutubeUrl,
    clearUpload,
    setError,
    hasUpload,
  };
}
