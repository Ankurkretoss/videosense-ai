"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Clapperboard,
  Map,
  ShieldAlert,
  Target,
  Users,
} from "lucide-react";
import { VideoOverview } from "@/components/VideoOverview";
import { MatchSummaryCard } from "./MatchSummaryCard";
import { MatchFilmPanel } from "./MatchVideoPlayer";
import { VideoInfoCard } from "./VideoInfoCard";
import { TeamComparison } from "./TeamComparison";
import { MatchTimeline } from "./MatchTimeline";
import { GoalsList } from "./GoalsList";
import { PlayerRoster } from "./PlayerRoster";
import { AwardsPanel } from "./AwardsPanel";
import { EventTables } from "./EventTables";
import { TacticsPanel } from "./TacticsPanel";
import { PitchMaps } from "./PitchMaps";
import { MatchReportPanel } from "./MatchReportPanel";
import { HighlightClips } from "./HighlightClips";
import { ImprovementList } from "./ImprovementList";
import { NarrativePanel } from "./NarrativePanel";
import { useHighlightClips, type HighlightClipsState } from "@/hooks/useHighlightClips";
import { youtubeVideoId } from "@/lib/video-meta";
import { cn } from "@/lib/utils";
import type { Highlight, SportsAnalysis } from "@/types/sports-analysis";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "players", label: "Players", icon: Users },
  { id: "events", label: "Events", icon: Activity },
  { id: "tactics", label: "Tactics & report", icon: Target },
  { id: "maps", label: "Pitch maps", icon: Map },
  { id: "clips", label: "Clips", icon: Clapperboard },
] as const;

type TabId = (typeof TABS)[number]["id"];

const EMPTY_HIGHLIGHTS: Highlight[] = [];

interface MatchReportViewProps {
  analysis: SportsAnalysis;
  /** The uploaded file, when this report was produced in this session. */
  sourceFile?: File | null;
  /** Object URL for the uploaded file. */
  filePreview?: string | null;
  youtubeUrl?: string | null;
  /** Clip queue from the page; when omitted the view runs its own. */
  clipState?: HighlightClipsState;
  headerTitle?: string;
  headerActions?: ReactNode;
  headerNote?: ReactNode;
}

export function MatchReportView({
  analysis,
  sourceFile = null,
  filePreview = null,
  youtubeUrl = null,
  clipState,
  headerTitle = "Match Report",
  headerActions,
  headerNote,
}: MatchReportViewProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [embedSeek, setEmbedSeek] = useState({ seconds: 0, nonce: 0 });

  const ownClipState = useHighlightClips(
    clipState ? EMPTY_HIGHLIGHTS : analysis.highlights,
    clipState ? null : sourceFile
  );
  const clips = clipState ?? ownClipState;

  const youtubeId = youtubeUrl ? youtubeVideoId(youtubeUrl) : null;

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
        setEmbedSeek((current) => ({ seconds: target, nonce: current.nonce + 1 }));
      }
    },
    [youtubeId]
  );

  const hasFilm = Boolean((sourceFile && filePreview) || youtubeId);
  const seek = hasFilm ? handleSeek : undefined;

  const teamAName = analysis.playerCount.teamA.name;
  const teamBName = analysis.playerCount.teamB.name;

  const tabCounts = useMemo<Partial<Record<TabId, number>>>(
    () => ({
      players: analysis.players.length,
      events:
        analysis.shots.length +
        analysis.passes.length +
        analysis.kicks.length +
        analysis.touches.length +
        analysis.defensiveActions.length +
        analysis.refereeDecisions.length,
      clips: analysis.highlights.length,
    }),
    [analysis]
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">{headerTitle}</h1>
          <p className="mt-2 text-gray-400">
            {analysis.report.finalScore} · {analysis.players.length} players tracked ·{" "}
            {analysis.highlights.length} clip-ready moments
          </p>
        </div>
        {headerActions}
      </div>

      {headerNote}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200/80"
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <span>
          Jersey numbers, tracking distances, speeds, angles, xG and ratings are AI estimates read
          from the footage — treat them as scouting indications, not officially measured data.
        </span>
      </motion.div>

      <div
        className={cn(
          "grid gap-6",
          hasFilm && "xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_460px]"
        )}
      >
        <div className="order-2 min-w-0 space-y-6 xl:order-1">
          <div className="sticky top-16 z-10 -mx-1 overflow-x-auto bg-gradient-to-b from-black/85 to-black/40 px-1 py-2 backdrop-blur">
            <div className="flex gap-1.5">
              {TABS.map((item) => {
                const Icon = item.icon;
                const count = tabCounts[item.id];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                      tab === item.id
                        ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                    {count !== undefined && count > 0 && (
                      <span className="text-xs text-gray-500">
                        {item.id === "clips" && clips.total > 0 && clips.readyCount < clips.total
                          ? `${clips.readyCount}/${count}`
                          : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {tab === "overview" && (
            <div className="space-y-6">
              <VideoOverview metadata={analysis.metadata} />
              <MatchSummaryCard
                sport={analysis.sport}
                matchSummary={analysis.matchSummary}
                playerCount={analysis.playerCount}
              />
              <TeamComparison teamStats={analysis.teamStats} report={analysis.report} />
              <VideoInfoCard videoInfo={analysis.videoInfo} ballAnalysis={analysis.ballAnalysis} />
              <GoalsList goals={analysis.goals} teamAName={teamAName} onSeek={seek} />
              <MatchTimeline timeline={analysis.timeline} onSeek={seek} />
            </div>
          )}

          {tab === "players" && (
            <div className="space-y-6">
              <AwardsPanel awards={analysis.awards} teamAName={teamAName} />
              <PlayerRoster
                players={analysis.players}
                teamAName={teamAName}
                teamBName={teamBName}
              />
            </div>
          )}

          {tab === "events" && (
            <div className="space-y-6">
              <EventTables analysis={analysis} />
              <GoalsList goals={analysis.goals} teamAName={teamAName} onSeek={seek} />
            </div>
          )}

          {tab === "tactics" && (
            <div className="space-y-6">
              <TacticsPanel
                tactics={analysis.tactics}
                goalkeepers={analysis.goalkeepers}
                teamAName={teamAName}
              />
              <NarrativePanel
                narratives={analysis.narratives}
                turningPoints={analysis.turningPoints}
                keyBattles={analysis.keyBattles}
                onSeek={seek}
              />
              <ImprovementList
                improvements={analysis.improvements}
                tacticalInsights={analysis.tacticalInsights}
                onSeek={seek}
              />
              <MatchReportPanel
                report={analysis.report}
                dataQuality={analysis.dataQuality}
                teamAName={teamAName}
                teamBName={teamBName}
              />
            </div>
          )}

          {tab === "maps" && <PitchMaps analysis={analysis} />}

          {tab === "clips" && (
            <HighlightClips
              highlights={analysis.highlights}
              sourceFile={sourceFile}
              youtubeUrl={youtubeUrl}
              clipState={clips}
              onSeek={seek}
            />
          )}
        </div>

        {hasFilm && (
          <MatchFilmPanel
            title={sourceFile?.name ?? analysis.metadata.title}
            teamStats={analysis.teamStats}
            report={analysis.report}
            fileSrc={sourceFile ? filePreview : null}
            youtubeId={sourceFile ? null : youtubeId}
            videoRef={videoRef}
            seekSeconds={embedSeek.seconds}
            seekNonce={embedSeek.nonce}
            goals={analysis.goals}
            highlights={analysis.highlights}
            onSeek={handleSeek}
          />
        )}
      </div>
    </motion.div>
  );
}
