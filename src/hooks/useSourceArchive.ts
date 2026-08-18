import { useEffect, useRef, useState } from "react";
import { attachStoredSource, type StoredSourceRef } from "@/lib/analysis-store";

export type SourceUploadState = "idle" | "uploading" | "stored" | "error";

export interface SourceArchiveState {
  /** Object key once the video has finished uploading. */
  key: string | null;
  status: SourceUploadState;
  /** 0-100, tracked via the PUT request's own progress. */
  percent: number;
  error: string | null;
}

interface UseSourceArchiveInput {
  file: File | null;
  /** Stable key for this match — used as the storage folder, shared with clips. */
  matchKey: string;
  /** Firestore document id, once the report has been saved. */
  analysisId: string | null;
  enabled?: boolean;
}

/**
 * Uploads the original match video straight from the browser to object storage.
 * Started the moment analysis begins (not after it finishes) so the file is
 * archived in parallel with the AI passes instead of adding to the wait.
 */
export function useSourceArchive({
  file,
  matchKey,
  analysisId,
  enabled = true,
}: UseSourceArchiveInput): SourceArchiveState {
  const [key, setKey] = useState<string | null>(null);
  const [status, setStatus] = useState<SourceUploadState>("idle");
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startedFor = useRef<string | null>(null);
  const pendingRef = useRef<StoredSourceRef | null>(null);

  // Upload the file once per (match, file) pair.
  useEffect(() => {
    if (!enabled || !file || !matchKey) return;
    const token = `${matchKey}:${file.name}:${file.size}`;
    if (startedFor.current === token) return;
    startedFor.current = token;

    let cancelled = false;
    setStatus("uploading");
    setPercent(0);
    setError(null);

    (async () => {
      const response = await fetch("/api/videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchKey,
          filename: file.name,
          contentType: file.type || "video/mp4",
        }),
      });
      if (!response.ok) {
        throw new Error(
          (await response.json().catch(() => ({}))).error || "Could not reach video storage."
        );
      }
      const { url, key: objectKey } = (await response.json()) as { url: string; key: string };
      if (cancelled) return;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setPercent(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Video upload failed (${xhr.status}).`));
        };
        xhr.onerror = () => reject(new Error("Video upload failed."));
        xhr.send(file);
      });
      if (cancelled) return;

      pendingRef.current = { key: objectKey, size: file.size, name: file.name };
      setPercent(100);
      setKey(objectKey);
      setStatus("stored");
    })().catch((err: unknown) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : "Video upload failed.");
      setStatus("error");
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, file, matchKey]);

  // Record the key on the saved report as soon as both are available.
  useEffect(() => {
    if (!analysisId || !pendingRef.current) return;
    void attachStoredSource(analysisId, pendingRef.current).catch(() => {
      /* the doc still has the analysis itself; this can be retried later */
    });
  }, [analysisId, key]);

  return { key, status, percent, error };
}
