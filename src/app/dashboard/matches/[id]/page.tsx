"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Clock, Database, Loader2 } from "lucide-react";
import { Panel, PrimaryLink } from "@/components/vantage/ui";
import { MatchReport } from "@/components/vantage/report/MatchReport";
import { getStoredAnalysis, type StoredAnalysis } from "@/lib/analysis-store";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function StoredMatchPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [entry, setEntry] = useState<StoredAnalysis | null>(null);
  const configured = isFirebaseConfigured();
  const [loadState, setLoadState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const status = configured ? loadState : "error";
  const error = configured ? loadError : "Firebase is not configured on this deployment.";

  useEffect(() => {
    if (!id || !configured) return;

    let active = true;
    getStoredAnalysis(id)
      .then((stored) => {
        if (!active) return;
        if (!stored) {
          setLoadState("missing");
          return;
        }
        setEntry(stored);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Could not load this analysis.");
        setLoadState("error");
      });

    return () => {
      active = false;
    };
  }, [id, configured]);

  return (
    <div className="px-4 pt-7 pb-24 sm:px-6">
      <Link
        href="/dashboard/matches"
        className="inline-flex items-center gap-2 text-[13px] text-mute transition-colors hover:text-ink-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my matches
      </Link>

      <div className="mt-5">
        {status === "loading" && (
          <Panel className="flex items-center justify-center gap-3 p-10 text-[13.5px] text-mute">
            <Loader2 className="h-4 w-4 animate-spin text-brand" />
            Loading the saved report…
          </Panel>
        )}

        {status === "missing" && (
          <Panel className="p-10 text-center">
            <p className="text-[15px] font-bold">This analysis is no longer stored.</p>
            <PrimaryLink href="/dashboard/matches" className="mt-4">
              Back to my matches
            </PrimaryLink>
          </Panel>
        )}

        {status === "error" && (
          <Panel className="flex items-start gap-3 border-bad/30 bg-bad/[0.08] p-5 text-[13.5px] text-bad">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </Panel>
        )}

        {status === "ready" && entry && (
          <MatchReport
            analysis={entry.analysis}
            youtubeUrl={entry.sourceType === "youtube" ? entry.source : null}
            savedAt={entry.createdAt}
            storedClips={Object.fromEntries(
              Object.entries(entry.clips ?? {}).map(([id, ref]) => [id, ref.key])
            )}
            storedVideoKey={entry.sourceVideo?.key ?? null}
            note={
              <Panel className="flex flex-wrap items-center gap-3 p-3 text-[12px] text-mute">
                <span className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-brand" />
                  Saved report
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
                <span className="truncate">{entry.source}</span>
                {entry.trimmed.length > 0 && (
                  <span className="text-warn">
                    Not stored to keep the record small: {entry.trimmed.join(", ")}
                  </span>
                )}
                {entry.sourceType === "file" && (
                  <span className="ml-auto">
                    {entry.sourceVideo && Object.keys(entry.clips ?? {}).length > 0
                      ? `Original video and ${Object.keys(entry.clips).length} clips play from cloud storage.`
                      : entry.sourceVideo
                        ? "Original video plays from cloud storage."
                        : Object.keys(entry.clips ?? {}).length > 0
                          ? `${Object.keys(entry.clips).length} clips play from cloud storage.`
                          : "Clip cutting needs the original file — re-upload it to cut clips again."}
                  </span>
                )}
              </Panel>
            }
          />
        )}
      </div>
    </div>
  );
}
