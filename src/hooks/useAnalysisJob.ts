import { useCallback, useEffect, useState } from "react";
import { useUpload } from "@/hooks/useUpload";
import { useSportsAnalysis } from "@/hooks/useSportsAnalysis";
import { useHighlightClips } from "@/hooks/useHighlightClips";
import { useAnalysisArchive } from "@/hooks/useAnalysisArchive";
import { useClipArchive } from "@/hooks/useClipArchive";
import { useSourceArchive } from "@/hooks/useSourceArchive";
import { MAX_FILE_SIZE, YOUTUBE_URL_PATTERN } from "@/lib/constants";
import { probeVideoFile } from "@/lib/video-meta";
import type { Highlight } from "@/types/sports-analysis";

const EMPTY_HIGHLIGHTS: Highlight[] = [];

/**
 * Owns the entire "analyze a match" job — upload, the AI passes, clip cutting and
 * cloud archiving — independently of any one page. Instantiated once, above the
 * routed pages (see AnalysisJobProvider), so navigating away from /dashboard/new
 * does not interrupt a run in progress: the job keeps going in the background and
 * the header shows a small live status until it is done.
 */
export function useAnalysisJob() {
  const upload = useUpload();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [configState, setConfigState] = useState<"loading" | "ready" | "missing">("loading");
  const [urlDraft, setUrlDraft] = useState("");
  const [probe, setProbe] = useState<{ durationSeconds: number } | null>(null);
  const [sessionKey] = useState(() => `session-${Date.now().toString(36)}`);
  const [skipWait, setSkipWait] = useState(false);
  const analysis = useSportsAnalysis(apiKey);

  const clipState = useHighlightClips(
    analysis.result?.highlights ?? EMPTY_HIGHLIGHTS,
    analysis.status === "completed" ? upload.file : null
  );
  const archive = useAnalysisArchive(
    analysis.status === "completed" ? analysis.result : null,
    upload.file ? "file" : "youtube"
  );

  // Clips are pushed to cloud storage straight from the browser, so the saved
  // report still has them when the original file is gone.
  const matchKey = archive.savedId ?? sessionKey;
  const clipArchive = useClipArchive({
    clips: clipState.clips,
    matchKey,
    analysisId: archive.savedId,
    enabled: Boolean(upload.file),
  });

  // The original video starts uploading the moment analysis begins, in parallel
  // with the AI passes, so it is already archived by the time they finish.
  const sourceArchive = useSourceArchive({
    file: upload.file,
    matchKey,
    analysisId: archive.savedId,
    enabled: Boolean(upload.file) && analysis.status !== "idle",
  });

  useEffect(() => {
    let active = true;
    fetch("/api/config")
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        if (data.configured && data.apiKey) {
          setApiKey(data.apiKey);
          setConfigState("ready");
        } else {
          setConfigState("missing");
        }
      })
      .catch(() => active && setConfigState("missing"));

    return () => {
      active = false;
    };
  }, []);

  const handleFileSelected = useCallback(
    (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        upload.setError(`That file is larger than ${Math.round(MAX_FILE_SIZE / (1024 * 1024))} MB.`);
        return;
      }
      upload.setFile(file);
      void probeVideoFile(file).then((result) =>
        setProbe({ durationSeconds: result.durationSeconds })
      );
    },
    [upload]
  );

  const submitUrl = useCallback(() => {
    const value = urlDraft.trim();
    if (!YOUTUBE_URL_PATTERN.test(value)) {
      upload.setError("That does not look like a YouTube URL.");
      return;
    }
    upload.setYoutubeUrl(value);
  }, [urlDraft, upload]);

  const start = useCallback(() => {
    setSkipWait(false);
    if (upload.file) analysis.analyze(upload.file, "");
    else if (upload.youtubeUrl) analysis.analyze(null, upload.youtubeUrl);
  }, [upload, analysis]);

  const resetForNewMatch = useCallback(() => {
    analysis.reset();
    upload.clearUpload();
    setUrlDraft("");
    setProbe(null);
    setSkipWait(false);
  }, [analysis, upload]);

  /* The report is only considered finished once the clips and the original video
     exist and are safely in storage, so the job covers the whole task rather than
     just the AI passes. The video itself started uploading back when analysis
     began, so this wait is usually short — it is mostly already done by now. */
  const analysisDone = analysis.status === "completed" && analysis.result !== null;
  const totalClips = analysis.result?.highlights.length ?? 0;
  const clipsExpected = Boolean(upload.file) && totalClips > 0;
  const videoExpected = Boolean(upload.file);

  const cutDone =
    !clipsExpected || clipState.readyCount >= totalClips || clipState.error !== null;
  const uploadsDone =
    !clipsExpected ||
    clipArchive.status === "error" ||
    (cutDone && clipArchive.uploaded >= clipState.readyCount);
  const videoDone =
    !videoExpected || sourceArchive.status === "stored" || sourceArchive.status === "error";

  const finishing = analysisDone && !(cutDone && uploadsDone && videoDone) && !skipWait;

  const percent = !analysisDone
    ? analysis.progress.progress * 0.85
    : !cutDone
      ? 85 + (clipState.readyCount / Math.max(1, totalClips)) * 6
      : !uploadsDone
        ? 91 + (clipArchive.uploaded / Math.max(1, totalClips)) * 6
        : !videoDone
          ? 97 + (sourceArchive.percent / 100) * 3
          : 100;

  const stageMessage = !analysisDone
    ? analysis.progress.message
    : !cutDone
      ? `Cutting highlight clips — ${clipState.readyCount} of ${totalClips} ready...`
      : !uploadsDone
        ? `Saving clips to cloud storage — ${clipArchive.uploaded} of ${totalClips} stored...`
        : !videoDone
          ? `Saving original video to cloud storage — ${sourceArchive.percent}%...`
          : "Finishing up...";

  // Running as long as either the AI passes or the finishing chores are active —
  // this is what the header's mini status box watches to decide whether to show.
  const isRunning = analysis.isAnalyzing || finishing;

  return {
    upload,
    apiKey,
    configState,
    urlDraft,
    setUrlDraft,
    probe,
    skipWait,
    setSkipWait,
    analysis,
    clipState,
    archive,
    clipArchive,
    sourceArchive,
    handleFileSelected,
    submitUrl,
    start,
    resetForNewMatch,
    analysisDone,
    totalClips,
    finishing,
    percent,
    stageMessage,
    isRunning,
  };
}

export type AnalysisJob = ReturnType<typeof useAnalysisJob>;
