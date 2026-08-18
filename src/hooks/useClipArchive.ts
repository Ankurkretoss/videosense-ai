import { useCallback, useEffect, useRef, useState } from "react";
import { attachStoredClips, type StoredClipRef } from "@/lib/analysis-store";
import type { ReadyClip } from "@/hooks/useHighlightClips";

export type ClipUploadState = "idle" | "uploading" | "stored" | "error";

export interface ClipArchiveState {
  /** Clip id → object key in storage. */
  stored: Record<string, string>;
  status: ClipUploadState;
  uploaded: number;
  total: number;
  error: string | null;
}

interface UseClipArchiveInput {
  /** Clips cut in the browser, keyed by highlight id. */
  clips: Record<string, ReadyClip>;
  /** Stable key for this match — used as the storage folder. */
  matchKey: string;
  /** Firestore document id, once the report has been saved. */
  analysisId: string | null;
  enabled?: boolean;
}

/**
 * Uploads each cut clip straight from the browser to object storage using a
 * presigned URL, then records the object keys on the saved analysis so the clips
 * can be played back later without the original video.
 */
export function useClipArchive({
  clips,
  matchKey,
  analysisId,
  enabled = true,
}: UseClipArchiveInput): ClipArchiveState {
  const [stored, setStored] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<ClipUploadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const inFlight = useRef(new Set<string>());
  const pendingKeys = useRef<Record<string, StoredClipRef>>({});
  const queue = useRef<Promise<void>>(Promise.resolve());

  const upload = useCallback(
    async (clipId: string, clip: ReadyClip) => {
      const response = await fetch("/api/clips/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchKey, clipId, contentType: clip.blob.type || "video/mp4" }),
      });

      if (!response.ok) {
        throw new Error((await response.json().catch(() => ({}))).error || "Could not reach clip storage.");
      }

      const { url, key } = (await response.json()) as { url: string; key: string };

      const put = await fetch(url, {
        method: "PUT",
        body: clip.blob,
        headers: { "Content-Type": clip.blob.type || "video/mp4" },
      });

      if (!put.ok) throw new Error(`Clip upload failed (${put.status}).`);

      pendingKeys.current[clipId] = { key, size: clip.blob.size };
      setStored((current) => ({ ...current, [clipId]: key }));
    },
    [matchKey]
  );

  // Upload every clip once, one at a time so a batch does not saturate the network.
  useEffect(() => {
    if (!enabled || !matchKey) return;

    const fresh = Object.entries(clips).filter(
      ([clipId]) => !inFlight.current.has(clipId)
    );
    if (fresh.length === 0) return;

    fresh.forEach(([clipId]) => inFlight.current.add(clipId));
    setStatus("uploading");

    queue.current = queue.current.then(async () => {
      for (const [clipId, clip] of fresh) {
        try {
          await upload(clipId, clip);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Clip upload failed.");
          setStatus("error");
          inFlight.current.delete(clipId);
        }
      }
      setStatus((current) => (current === "error" ? current : "stored"));
    });
  }, [clips, enabled, matchKey, upload]);

  // Record the keys on the saved report as soon as both are available.
  useEffect(() => {
    if (!analysisId) return;
    const keys = pendingKeys.current;
    if (Object.keys(keys).length === 0) return;

    const snapshot = { ...keys };
    void attachStoredClips(analysisId, snapshot).catch(() => {
      /* retried on the next clip that lands */
    });
  }, [analysisId, stored]);

  return {
    stored,
    status,
    uploaded: Object.keys(stored).length,
    total: Object.keys(clips).length,
    error,
  };
}
