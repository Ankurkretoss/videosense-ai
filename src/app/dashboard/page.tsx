"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, Film, Link2, Loader2, Plus, Upload } from "lucide-react";
import { Chip, Kpi, Panel, PrimaryLink, StatusPill } from "@/components/vantage/ui";
import { listAnalyses, type StoredAnalysisSummary } from "@/lib/analysis-store";
import { isFirebaseConfigured } from "@/lib/firebase";
import { readSession } from "@/lib/session";

const FILTERS = ["All matches", "Football", "This month"] as const;

export default function DashboardHome() {
  const configured = isFirebaseConfigured();
  const [entries, setEntries] = useState<StoredAnalysisSummary[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>(FILTERS[0]);
  const [name, setName] = useState("Coach");

  useEffect(() => {
    const timer = setTimeout(() => setName(readSession()?.name?.split(" ")[0] ?? "Coach"), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!configured) return;

    let active = true;
    listAnalyses(24)
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
  }, [configured]);

  // Firebase availability is known at render time, so it is derived rather than stored.
  const status = configured ? loadState : "error";
  const error = configured
    ? loadError
    : "Firebase is not configured, so saved matches cannot be listed.";

  const kpis = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const thisMonth = entries.filter((entry) => entry.createdAt >= monthStart.getTime());
    const sum = (pick: (entry: StoredAnalysisSummary) => number) =>
      entries.reduce((total, entry) => total + pick(entry), 0);

    return [
      {
        label: "Matches analysed",
        value: entries.length,
        delta: `${thisMonth.length} this month`,
      },
      {
        label: "Events detected",
        value: sum((entry) => entry.eventCount).toLocaleString(),
        delta: `${sum((entry) => entry.goalCount)} goals`,
      },
      {
        label: "Clip-ready moments",
        value: sum((entry) => entry.highlightCount),
        delta: "cut from your uploads",
      },
      {
        label: "Players tracked",
        value: sum((entry) => entry.playerCount),
        delta: `${entries.length} squads`,
      },
    ];
  }, [entries]);

  const visible = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    if (filter === "Football") return entries.filter((entry) => /football|soccer/i.test(entry.sport));
    if (filter === "This month") return entries.filter((entry) => entry.createdAt >= monthStart.getTime());
    return entries;
  }, [entries, filter]);

  return (
    <div className="px-4 pt-7 pb-24 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Welcome back, {name}</h1>
          <p className="mt-1.5 text-[14px] text-mute">Ready to analyze your next match?</p>
        </div>
        <PrimaryLink href="/dashboard/new">
          <Plus className="h-4 w-4" />
          New match analysis
        </PrimaryLink>
      </div>

      <div className="mt-6 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Kpi key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} />
        ))}
      </div>

      <div className="mt-9 mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold">My matches</h2>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <Chip key={item} active={filter === item} onClick={() => setFilter(item)}>
              {item}
            </Chip>
          ))}
        </div>
      </div>

      {status === "loading" && (
        <Panel className="flex items-center justify-center gap-3 p-10 text-[13.5px] text-mute">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          Loading your matches…
        </Panel>
      )}

      {status === "error" && (
        <Panel className="flex items-start gap-3 border-warn/30 bg-warn/[0.06] p-5 text-[13.5px] text-warn">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </Panel>
      )}

      {status === "ready" && visible.length === 0 && (
        <Panel className="grid place-items-center p-12 text-center">
          <div className="grid h-[52px] w-[52px] place-items-center rounded-[15px] border border-brand/35 bg-brand/[0.14] text-brand-soft">
            <Film className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[15px] font-bold">No matches yet</p>
          <p className="mt-1.5 max-w-sm text-[13.5px] text-mute">
            Analyse a football match and it lands here automatically, with every event, player and
            clip attached.
          </p>
          <PrimaryLink href="/dashboard/new" className="mt-5">
            Analyse your first match
          </PrimaryLink>
        </Panel>
      )}

      {status === "ready" && visible.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((entry) => (
            <MatchCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatUploadedAt(timestamp: number): string {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} ${timePart}`;
}

export function MatchCard({ entry }: { entry: StoredAnalysisSummary }) {
  const stats = [
    { k: "Events", v: entry.eventCount },
    { k: "Players", v: entry.playerCount },
    { k: "Clips", v: entry.highlightCount },
    { k: "Goals", v: entry.goalCount },
  ];

  return (
    <Panel className="overflow-hidden transition-colors hover:border-brand/45">
      <Link href={`/dashboard/matches/${entry.id}`} className="block">
        <div className="hatch relative aspect-[16/8]">
          {entry.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.thumbnail}
              alt={entry.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="font-mono-num absolute inset-0 grid place-items-center text-[10.5px] tracking-[0.1em] text-[#4A4A58]">
              match still
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[rgba(7,7,10,0.95)] to-transparent" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <StatusPill className="border border-brand/30 bg-ink-800/95">Football</StatusPill>
            <StatusPill tone="good" className="border border-good/30 bg-ink-800/95">
              Completed
            </StatusPill>
            {entry.sourceType === "youtube" ? (
              <StatusPill className="flex items-center gap-1 border border-white/15 bg-ink-800/95">
                <Link2 className="h-3 w-3" />
                YouTube
              </StatusPill>
            ) : (
              <StatusPill className="flex items-center gap-1 border border-white/15 bg-ink-800/95">
                <Upload className="h-3 w-3" />
                Uploaded
              </StatusPill>
            )}
          </div>
          <div className="absolute bottom-3 left-3.5 right-3.5">
            <div className="truncate text-[15px] font-bold">{entry.title}</div>
            <div className="mt-0.5 truncate text-[12px] text-mute">
              {entry.teamAName} {entry.teamAGoals}–{entry.teamBGoals} {entry.teamBName}
            </div>
          </div>
        </div>
      </Link>

      <div className="p-3.5">
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div key={stat.k}>
              <div className="font-mono-num text-[14px] text-ink-200">{stat.v}</div>
              <div className="mt-0.5 text-[10.5px] text-mute-3">{stat.k}</div>
            </div>
          ))}
        </div>
        <div className="mt-3.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-mute-3">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{formatUploadedAt(entry.createdAt)}</span>
          </div>
          <Link
            href={`/dashboard/matches/${entry.id}`}
            className="shrink-0 rounded-[8px] border border-brand/35 bg-brand/[0.12] px-3 py-1.5 text-[12px] font-bold text-brand-soft transition-colors hover:bg-brand/20"
          >
            View analysis
          </Link>
        </div>
      </div>
    </Panel>
  );
}
