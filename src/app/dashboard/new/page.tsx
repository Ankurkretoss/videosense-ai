"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  AlertCircle,
  Check,
  FileVideo,
  Link2,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  ComingSoonBadge,
  GhostButton,
  Panel,
  PanelHeader,
  PrimaryButton,
  ProgressBar,
  SoftButton,
} from "@/components/vantage/ui";
import { MatchReport } from "@/components/vantage/report/MatchReport";
import { ProcessingScreen } from "@/components/vantage/ProcessingScreen";
import { ArchiveBanner } from "@/components/vantage/ArchiveBanner";
import { useUpload } from "@/hooks/useUpload";
import { useSportsAnalysis } from "@/hooks/useSportsAnalysis";
import { useHighlightClips } from "@/hooks/useHighlightClips";
import { useAnalysisArchive } from "@/hooks/useAnalysisArchive";
import { useClipArchive } from "@/hooks/useClipArchive";
import { useSourceArchive } from "@/hooks/useSourceArchive";
import { SPORTS } from "@/lib/vantage-content";
import { ACCEPTED_VIDEO_TYPES, MAX_FILE_SIZE, YOUTUBE_URL_PATTERN } from "@/lib/constants";
import { probeVideoFile } from "@/lib/video-meta";
import { secondsToTimestamp } from "@/lib/time";
import type { Highlight } from "@/types/sports-analysis";
import { cn } from "@/lib/utils";

const EMPTY_HIGHLIGHTS: Highlight[] = [];

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewAnalysisPage() {
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

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_VIDEO_TYPES,
    maxFiles: 1,
    disabled: analysis.isAnalyzing,
  });

  const submitUrl = () => {
    const value = urlDraft.trim();
    if (!YOUTUBE_URL_PATTERN.test(value)) {
      upload.setError("That does not look like a YouTube URL.");
      return;
    }
    upload.setYoutubeUrl(value);
  };

  const start = () => {
    setSkipWait(false);
    if (upload.file) analysis.analyze(upload.file, "");
    else if (upload.youtubeUrl) analysis.analyze(null, upload.youtubeUrl);
  };

  /* The report is only shown once the clips and the original video exist and are
     safely in storage, so the analysis screen covers the whole job rather than
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

  if (analysisDone && analysis.result && !finishing) {
    return (
      <div className="px-4 pt-7 pb-24 sm:px-6">
        <MatchReport
          analysis={analysis.result}
          sourceFile={upload.file}
          filePreview={upload.preview}
          youtubeUrl={upload.youtubeUrl || null}
          clipState={clipState}
          storedClips={clipArchive.stored}
          storedVideoKey={sourceArchive.key}
          uploadNote={
            clipArchive.status === "uploading"
              ? `${clipArchive.uploaded}/${clipArchive.total} saved to cloud`
              : clipArchive.status === "stored" && clipArchive.uploaded > 0
                ? `${clipArchive.uploaded} clips saved to cloud`
                : clipArchive.status === "error"
                  ? "cloud upload failed"
                  : null
          }
          note={
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <ArchiveBanner archive={archive} />
              </div>
              <PrimaryButton
                onClick={() => {
                  analysis.reset();
                  upload.clearUpload();
                  setUrlDraft("");
                }}
                className="px-4 py-2.5 text-[13px]"
              >
                Analyse another match
              </PrimaryButton>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1080px] px-4 pt-7 pb-24 sm:px-6">
      <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Analyze your match</h1>
      <p className="mt-1.5 mb-6 text-[14px] text-mute">
        Upload footage or paste a link. The AI handles detection, tracking, events, tactics and clips.
      </p>

      {configState === "missing" && (
        <Panel className="mb-4 flex items-start gap-3 border-warn/30 bg-warn/[0.06] p-4 text-[13px] text-warn">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            No Gemini API key is configured. Add{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">GEMINI_API_KEY</code> to{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">.env.local</code> and restart the
            server.
          </span>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div
          {...getRootProps()}
          className={cn(
            "cursor-pointer rounded-[14px] border border-dashed border-brand/40 bg-gradient-to-b from-brand/[0.07] to-brand/[0.01] p-6 text-center transition-colors",
            isDragActive && "border-brand bg-brand/[0.12]",
            analysis.isAnalyzing && "pointer-events-none opacity-60"
          )}
        >
          <input {...getInputProps()} />
          <div className="mx-auto mt-1.5 grid h-11 w-11 place-items-center rounded-[13px] border border-brand/35 bg-brand/[0.16] text-brand-soft">
            <Upload className="h-4 w-4" />
          </div>
          <div className="mt-3.5 text-[17px] font-bold">Drag &amp; drop your match video</div>
          <div className="mt-1.5 text-[13px] text-mute">
            MP4, MOV, MKV, WebM · up to {Math.round(MAX_FILE_SIZE / (1024 * 1024))} MB
          </div>
          <GhostButton type="button" className="mt-4 px-4 py-2.5 text-[13px]">
            Browse files
          </GhostButton>

          {upload.file && (
            <div className="mt-5 rounded-[11px] border border-white/[0.11] bg-ink-600 p-3.5 text-left">
              <div className="flex items-center justify-between gap-3 text-[12.5px] text-ink-300">
                <span className="font-mono-num truncate">{upload.file.name}</span>
                <span className="flex items-center gap-1 font-bold text-good">
                  <Check className="h-3.5 w-3.5" />
                  Ready
                </span>
              </div>
              <ProgressBar value={100} className="mt-2.5" />
              <div className="font-mono-num mt-2 flex items-center justify-between text-[11.5px] text-mute-3">
                <span>{formatSize(upload.file.size)}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    upload.clearUpload();
                  }}
                  className="flex items-center gap-1 text-mute-2 hover:text-bad"
                >
                  <X className="h-3 w-3" />
                  remove
                </button>
              </div>
            </div>
          )}
        </div>

        <Panel className="flex flex-col p-[22px]">
          <PanelHeader
            title="Or paste a link"
            hint="A YouTube URL, where the video's rights and access permit analysis."
          />
          <div className="mt-3.5 flex items-center gap-2 rounded-[10px] border border-white/[0.09] bg-ink-800 px-3.5 py-3">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-mute-4" />
            <input
              value={urlDraft}
              onChange={(event) => setUrlDraft(event.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              disabled={analysis.isAnalyzing}
              className="font-mono-num w-full bg-transparent text-[13px] text-ink-100 outline-none placeholder:text-mute-4"
            />
          </div>
          <SoftButton type="button" onClick={submitUrl} className="mt-3 w-full">
            Use this link
          </SoftButton>

          {upload.youtubeUrl && (
            <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-good/30 bg-good/[0.08] px-3 py-2.5 text-[12.5px] text-good">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{upload.youtubeUrl}</span>
            </div>
          )}

          <p className="mt-auto pt-4 text-[11.5px] leading-relaxed text-mute-4">
            Analysis quality depends on camera angle and footage resolution. Tactical-cam or
            broadcast footage gives the highest tracking confidence. Clip cutting is only available
            for uploaded files.
          </p>
        </Panel>
      </div>

      <Panel className="mt-6 p-[22px]">
        <PanelHeader
          title="Select sport"
          hint="Football is live today. The other sports are on the roadmap."
        />
        <div className="mt-3.5 flex flex-wrap gap-2">
          {SPORTS.map((sport) => (
            <button
              key={sport.name}
              type="button"
              disabled={!sport.available}
              className={cn(
                "flex items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-[13px] font-semibold transition-colors",
                sport.available
                  ? "border-brand/50 bg-brand/[0.14] text-brand-pale"
                  : "cursor-not-allowed border-white/[0.11] bg-panel-3 text-mute-3"
              )}
            >
              <span className="font-mono-num text-[11px] opacity-80">{sport.abbr}</span>
              {sport.name}
              {!sport.available && <ComingSoonBadge />}
            </button>
          ))}
        </div>
        <div className="mt-3 text-[12.5px] text-mute-3">{SPORTS[0].model}</div>
      </Panel>

      {upload.error && (
        <Panel className="mt-4 flex items-center gap-2 border-bad/30 bg-bad/[0.08] p-4 text-[13px] text-bad">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {upload.error}
        </Panel>
      )}

      {analysis.error && (
        <Panel className="mt-4 flex items-center gap-2 border-bad/30 bg-bad/[0.08] p-4 text-[13px] text-bad">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {analysis.error}
        </Panel>
      )}

      {analysis.isAnalyzing || finishing ? (
        <div className="mt-2">
          <ProcessingScreen
            title={upload.file?.name ?? "your match"}
            durationLabel={probe ? secondsToTimestamp(probe.durationSeconds) : ""}
            durationSeconds={probe?.durationSeconds ?? 0}
            percent={percent}
            message={stageMessage}
            detail={analysis.detail}
            clipProgress={
              finishing
                ? {
                    cut: clipState.readyCount,
                    stored: clipArchive.uploaded,
                    total: totalClips,
                  }
                : null
            }
            onSkip={finishing ? () => setSkipWait(true) : undefined}
            onCancel={analysis.cancel}
          />
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3.5 border-t border-white/[0.09] pt-5">
          <PrimaryButton
            onClick={start}
            disabled={!upload.hasUpload || configState !== "ready"}
            className="px-6 py-3.5 text-[14px]"
          >
            {configState === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Start analysis
          </PrimaryButton>
          <div className="flex items-center gap-2 text-[12.5px] text-mute-3">
            <FileVideo className="h-3.5 w-3.5" />
            {upload.hasUpload
              ? `Football · ${upload.file ? upload.file.name : "YouTube link"}`
              : "Add footage or a link to begin"}
          </div>
        </div>
      )}
    </div>
  );
}
