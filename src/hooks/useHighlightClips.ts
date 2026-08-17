import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildHighlightReel,
  downloadBlob,
  extractClip,
  extractClips,
  slugifyFilename,
  type ClipWindow,
} from "@/lib/clip";
import { createZip } from "@/lib/zip";
import { timeToSeconds } from "@/lib/time";
import type { Highlight } from "@/types/sports-analysis";

export interface ReadyClip {
  blob: Blob;
  url: string;
}

export function clipWindowFor(highlight: Highlight): ClipWindow {
  return {
    id: highlight.id,
    label: `${highlight.startTimestamp.replace(/:/g, "-")}-${slugifyFilename(highlight.title)}`,
    startSeconds: timeToSeconds(highlight.startTimestamp),
    endSeconds: timeToSeconds(highlight.endTimestamp),
  };
}

export interface HighlightClipsState {
  clips: Record<string, ReadyClip>;
  busy: string | null;
  progress: number;
  statusText: string;
  error: string | null;
  readyCount: number;
  total: number;
  autoRunning: boolean;
  generateOne: (highlight: Highlight) => void;
  downloadZip: (selection: Highlight[]) => void;
  buildReel: (selection: Highlight[], filename: string) => void;
  cancel: () => void;
}

/**
 * Owns the ffmpeg clip queue for a report.
 *
 * It lives at page level rather than inside the Clips tab so cutting starts the
 * moment the analysis lands — by the time the user opens the tab the clips are
 * already there, whichever tab they were looking at.
 */
export function useHighlightClips(
  highlights: Highlight[],
  sourceFile: File | null
): HighlightClipsState {
  const [clips, setClips] = useState<Record<string, ReadyClip>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef<string | null>(null);
  const autoStartedFor = useRef<File | null>(null);
  const clipsRef = useRef<Record<string, ReadyClip>>({});

  const storeClip = useCallback((id: string, blob: Blob) => {
    setClips((current) => {
      if (current[id]) URL.revokeObjectURL(current[id].url);
      const next = { ...current, [id]: { blob, url: URL.createObjectURL(blob) } };
      clipsRef.current = next;
      return next;
    });
  }, []);

  const runJob = useCallback(
    async (job: string, task: (signal: AbortSignal) => Promise<void>) => {
      if (busyRef.current) return;
      const controller = new AbortController();
      abortRef.current = controller;
      busyRef.current = job;
      setBusy(job);
      setProgress(0);
      setError(null);
      try {
        await task(controller.signal);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Clip generation failed.");
      } finally {
        busyRef.current = null;
        setBusy(null);
        setStatusText("");
        abortRef.current = null;
      }
    },
    []
  );

  // Cut everything up front, in one ffmpeg session, as soon as a report arrives.
  useEffect(() => {
    if (!sourceFile || highlights.length === 0) return;
    if (autoStartedFor.current === sourceFile) return;
    autoStartedFor.current = sourceFile;

    // Deferred a tick so kicking the queue off does not setState inside the effect body.
    const timer = setTimeout(() => {
      void runJob("auto", async (signal) => {
        setStatusText(`Preparing ${highlights.length} clips...`);
        await extractClips(sourceFile, highlights.map(clipWindowFor), {
          signal,
          onProgress: setProgress,
          onClip: (clip) => storeClip(clip.id, clip.blob),
          onClipDone: (done, total) => setStatusText(`Cut ${done} of ${total} clips`),
        });
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [sourceFile, highlights, runJob, storeClip]);

  // A new analysis means the old blobs are dead weight. Released on the next tick
  // so the cleanup never triggers a cascading render from inside the effect body.
  useEffect(() => {
    if (sourceFile || Object.keys(clipsRef.current).length === 0) return;

    const timer = setTimeout(() => {
      Object.values(clipsRef.current).forEach((clip) => URL.revokeObjectURL(clip.url));
      clipsRef.current = {};
      setClips({});
    }, 0);

    return () => clearTimeout(timer);
  }, [sourceFile]);

  const generateOne = useCallback(
    (highlight: Highlight) =>
      void runJob(highlight.id, async () => {
        if (!sourceFile) return;
        setStatusText(`Cutting “${highlight.title}”...`);
        const blob = await extractClip(
          sourceFile,
          timeToSeconds(highlight.startTimestamp),
          timeToSeconds(highlight.endTimestamp),
          { onProgress: setProgress }
        );
        storeClip(highlight.id, blob);
      }),
    [runJob, sourceFile, storeClip]
  );

  const downloadZip = useCallback(
    (selection: Highlight[]) =>
      void runJob("zip", async (signal) => {
        if (!sourceFile) return;

        // Anything the auto-cut has not reached yet is cut now; state updates land
        // after this callback, so freshly cut blobs are also kept locally.
        const missing = selection.filter((highlight) => !clipsRef.current[highlight.id]);
        const freshlyCut = new Map<string, Blob>();

        if (missing.length > 0) {
          await extractClips(sourceFile, missing.map(clipWindowFor), {
            signal,
            onProgress: setProgress,
            onClip: (clip) => {
              freshlyCut.set(clip.id, clip.blob);
              storeClip(clip.id, clip.blob);
            },
            onClipDone: (done, total) => setStatusText(`Cut ${done} of ${total} remaining clips`),
          });
        }

        setStatusText("Packing the ZIP...");
        const entries = selection
          .map((highlight) => ({
            highlight,
            blob: clipsRef.current[highlight.id]?.blob ?? freshlyCut.get(highlight.id),
          }))
          .filter((entry): entry is { highlight: Highlight; blob: Blob } => Boolean(entry.blob))
          .map((entry) => ({
            name: `clips/${clipWindowFor(entry.highlight).label}.mp4`,
            data: entry.blob,
          }));

        downloadBlob(await createZip(entries), `highlight-clips-${entries.length}.zip`);
      }),
    [runJob, sourceFile, storeClip]
  );

  const buildReel = useCallback(
    (selection: Highlight[], filename: string) =>
      void runJob("reel", async (signal) => {
        if (!sourceFile) return;
        const reel = await buildHighlightReel(sourceFile, selection.map(clipWindowFor), {
          signal,
          onProgress: setProgress,
          onClipDone: (done, total) => setStatusText(`Adding moment ${done} of ${total}...`),
        });
        downloadBlob(reel, filename);
      }),
    [runJob, sourceFile]
  );

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  const readyCount = useMemo(
    () => highlights.filter((highlight) => clips[highlight.id]).length,
    [highlights, clips]
  );

  return {
    clips,
    busy,
    progress,
    statusText,
    error,
    readyCount,
    total: highlights.length,
    autoRunning: busy === "auto",
    generateOne,
    downloadZip,
    buildReel,
    cancel,
  };
}
