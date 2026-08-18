"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { MetaChip, TabButton } from "./report-bits";
import { OverviewTab } from "./OverviewTab";
import { PlayersTab } from "./PlayersTab";
import { EventsTab } from "./EventsTab";
import { TacticsTab } from "./TacticsTab";
import { MapsTab } from "./MapsTab";
import { ClipsTab } from "./ClipsTab";
import { GhostButton, PrimaryButton } from "@/components/vantage/ui";
import { useHighlightClips, type HighlightClipsState } from "@/hooks/useHighlightClips";
import { matchReportMarkdown, analysisBundleName } from "@/lib/sports-export";
import { downloadBlob } from "@/lib/clip";
import { youtubeVideoId } from "@/lib/video-meta";
import type { Highlight, SportsAnalysis } from "@/types/sports-analysis";

const TABS = ["Overview", "Players", "Events", "Tactics & report", "Pitch maps", "Clips"] as const;
type Tab = (typeof TABS)[number];

const EMPTY_HIGHLIGHTS: Highlight[] = [];

interface MatchReportProps {
  analysis: SportsAnalysis;
  sourceFile?: File | null;
  filePreview?: string | null;
  youtubeUrl?: string | null;
  clipState?: HighlightClipsState;
  /** Shown under the header — save status, saved-report meta, and so on. */
  note?: ReactNode;
  savedAt?: number;
  /** Opens the report on a specific tab (used for deep links). */
  initialTab?: string;
}

export function MatchReport({
  analysis,
  sourceFile = null,
  filePreview = null,
  youtubeUrl = null,
  clipState,
  note,
  savedAt,
  initialTab,
}: MatchReportProps) {
  const [tab, setTab] = useState<Tab>(
    () => TABS.find((name) => name.toLowerCase() === initialTab?.toLowerCase()) ?? "Overview"
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [embedSeek, setEmbedSeek] = useState({ seconds: 0, nonce: 0 });
  const [shared, setShared] = useState(false);

  const ownClipState = useHighlightClips(
    clipState ? EMPTY_HIGHLIGHTS : analysis.highlights,
    clipState ? null : sourceFile
  );
  const clips = clipState ?? ownClipState;

  const youtubeId = youtubeUrl ? youtubeVideoId(youtubeUrl) : null;
  const fileSrc = sourceFile ? filePreview : null;
  const canSeek = Boolean(fileSrc || youtubeId);

  const handleSeek = useCallback(
    (seconds: number) => {
      const target = Math.max(0, seconds);
      const video = videoRef.current;

      if (video) {
        video.currentTime = target;
        void video.play().catch(() => {});
        video.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      if (youtubeId) {
        // The embed lives on the Overview tab, so jump there before seeking.
        setTab("Overview");
        setEmbedSeek((current) => ({ seconds: target, nonce: current.nonce + 1 }));
      }
    },
    [youtubeId]
  );

  const seek = canSeek ? handleSeek : undefined;

  const eventCount =
    analysis.touches.length +
    analysis.passes.length +
    analysis.kicks.length +
    analysis.shots.length +
    analysis.defensiveActions.length +
    analysis.refereeDecisions.length;

  // Rendered after mount so the date is never computed during render.
  const [reportDate, setReportDate] = useState("");
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setReportDate(
          new Date(savedAt ?? Date.now())
            .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
            .toUpperCase()
        ),
      0
    );
    return () => clearTimeout(timer);
  }, [savedAt]);

  const exportReport = () =>
    downloadBlob(
      new Blob([matchReportMarkdown(analysis)], { type: "text/markdown" }),
      `${analysisBundleName(analysis)}.md`
    );

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2200);
    } catch {
      setShared(false);
    }
  };

  const tabCount = (name: Tab): number | undefined => {
    if (name === "Players") return analysis.players.length;
    if (name === "Events") return eventCount;
    if (name === "Clips") return analysis.highlights.length;
    return undefined;
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="font-mono-num text-[11.5px] tracking-[0.1em] text-mute-2 uppercase">
            Match report · {analysis.sport.replace(/\s*\(.*\)$/, "")}
            {reportDate ? ` · ${reportDate}` : ""}
          </div>
          <h1 className="mt-2.5 text-[28px] font-extrabold tracking-[-0.03em]">
            {analysis.playerCount.teamA.name} {analysis.report.teamAGoals} —{" "}
            {analysis.report.teamBGoals} {analysis.playerCount.teamB.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <MetaChip>{analysis.videoInfo.duration || analysis.metadata.duration} duration</MetaChip>
            <MetaChip>{analysis.players.length} players tracked</MetaChip>
            <MetaChip>{eventCount} events detected</MetaChip>
            <MetaChip>{analysis.highlights.length} clips generated</MetaChip>
            <MetaChip>{analysis.videoInfo.resolution}</MetaChip>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <GhostButton onClick={exportReport} className="px-4 py-2.5 text-[13px]">
            Export report
          </GhostButton>
          <PrimaryButton onClick={share} className="px-4 py-2.5 text-[13px]">
            {shared ? "Link copied" : "Share report"}
          </PrimaryButton>
        </div>
      </div>

      {note && <div className="mt-4">{note}</div>}

      <div className="mt-5 mb-5 flex gap-1 overflow-x-auto border-b border-white/10">
        {TABS.map((name) => (
          <TabButton
            key={name}
            label={name}
            count={
              name === "Clips" && clips.total > 0 && clips.readyCount < clips.total
                ? `${clips.readyCount}/${analysis.highlights.length}`
                : tabCount(name)
            }
            active={tab === name}
            onClick={() => setTab(name)}
          />
        ))}
      </div>

      {tab === "Overview" && (
        <OverviewTab
          analysis={analysis}
          fileSrc={fileSrc}
          youtubeId={youtubeId}
          videoRef={videoRef}
          embedSeek={embedSeek}
          onSeek={seek}
        />
      )}
      {tab === "Players" && <PlayersTab analysis={analysis} />}
      {tab === "Events" && <EventsTab analysis={analysis} onSeek={seek} />}
      {tab === "Tactics & report" && <TacticsTab analysis={analysis} />}
      {tab === "Pitch maps" && <MapsTab analysis={analysis} />}
      {tab === "Clips" && (
        <ClipsTab
          highlights={analysis.highlights}
          clipState={clips}
          hasSourceFile={Boolean(sourceFile)}
          youtubeId={youtubeId}
          onSeek={seek}
        />
      )}
    </div>
  );
}
