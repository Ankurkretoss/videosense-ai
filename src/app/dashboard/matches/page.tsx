"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, RefreshCw, Search, Trash2 } from "lucide-react";
import { Chip, GhostButton, Panel, PrimaryLink } from "@/components/vantage/ui";
import { MatchCard } from "@/app/dashboard/page";
import { deleteAnalysis, listAnalyses, type StoredAnalysisSummary } from "@/lib/analysis-store";
import { isFirebaseConfigured } from "@/lib/firebase";

const SORTS = ["Newest", "Most events", "Most clips"] as const;

export default function MatchesPage() {
  const configured = isFirebaseConfigured();
  const [entries, setEntries] = useState<StoredAnalysisSummary[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<string>(SORTS[0]);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;

    let active = true;
    listAnalyses(60)
      .then((rows) => {
        if (!active) return;
        setEntries(rows);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Could not load your matches.");
        setLoadState("error");
      });

    return () => {
      active = false;
    };
  }, [configured, reloadToken]);

  const status = configured ? loadState : "error";
  const error = configured
    ? loadError
    : "Firebase is not configured, so saved matches cannot be listed.";

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = needle
      ? entries.filter((entry) =>
          [entry.title, entry.teamAName, entry.teamBName, entry.summary]
            .join(" ")
            .toLowerCase()
            .includes(needle)
        )
      : [...entries];

    if (sort === "Most events") rows.sort((a, b) => b.eventCount - a.eventCount);
    else if (sort === "Most clips") rows.sort((a, b) => b.highlightCount - a.highlightCount);
    else rows.sort((a, b) => b.createdAt - a.createdAt);

    return rows;
  }, [entries, query, sort]);

  const remove = async (id: string) => {
    setRemoving(id);
    try {
      await deleteAnalysis(id);
      setEntries((current) => current.filter((entry) => entry.id !== id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not delete this analysis.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="px-4 pt-7 pb-24 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">My matches</h1>
          <p className="mt-1.5 text-[14px] text-mute">
            Every analysed match is stored with its full report, events and clip windows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GhostButton onClick={() => setReloadToken((token) => token + 1)}>
            <RefreshCw className={status === "loading" ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </GhostButton>
          <PrimaryLink href="/dashboard/new">New analysis</PrimaryLink>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-[10px] border border-white/[0.11] bg-ink-600 px-3 py-2.5">
          <Search className="h-3.5 w-3.5 text-mute-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by match, team or summary"
            className="w-full bg-transparent text-[13px] text-ink-100 outline-none placeholder:text-mute-4"
          />
        </div>
        <div className="flex gap-1.5">
          {SORTS.map((item) => (
            <Chip key={item} active={sort === item} onClick={() => setSort(item)}>
              {item}
            </Chip>
          ))}
        </div>
      </div>

      {status === "loading" && (
        <Panel className="mt-5 flex items-center justify-center gap-3 p-10 text-[13.5px] text-mute">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          Loading saved matches…
        </Panel>
      )}

      {status === "error" && (
        <Panel className="mt-5 flex items-start gap-3 border-warn/30 bg-warn/[0.06] p-5 text-[13.5px] text-warn">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </Panel>
      )}

      {status === "ready" && visible.length === 0 && (
        <Panel className="mt-5 p-10 text-center text-[13.5px] text-mute">
          Nothing matches that search yet.
        </Panel>
      )}

      {status === "ready" && visible.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((entry) => (
            <div key={entry.id} className="relative">
              <MatchCard entry={entry} />
              <button
                type="button"
                onClick={() => remove(entry.id)}
                disabled={removing === entry.id}
                aria-label="Delete analysis"
                className="absolute top-3 right-3 rounded-lg border border-white/10 bg-ink/80 p-1.5 text-mute-2 transition-colors hover:border-bad/40 hover:text-bad"
              >
                {removing === entry.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
