"use client";

import type { RefObject } from "react";
import { motion } from "framer-motion";
import { Film, Goal as GoalIcon, Play, Sparkles } from "lucide-react";
import { timeToSeconds } from "@/lib/time";
import { cn } from "@/lib/utils";
import { TEAM_COLORS, jerseyDisplay } from "./report-ui";
import type { GoalEvent, Highlight, MatchReport, TeamStats } from "@/types/sports-analysis";

interface MatchFilmPanelProps {
  title: string;
  teamStats: TeamStats[];
  report: MatchReport;
  /** Object URL of the uploaded file, when the analysis came from a local video. */
  fileSrc?: string | null;
  /** YouTube video id, when the analysis came from a URL. */
  youtubeId?: string | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Seek target for the YouTube embed — the iframe reloads whenever the nonce changes. */
  seekSeconds: number;
  seekNonce: number;
  goals: GoalEvent[];
  highlights: Highlight[];
  onSeek: (seconds: number) => void;
}

interface JumpEntry {
  timestamp: string;
  label: string;
  isGoal: boolean;
}

export function MatchFilmPanel({
  title,
  teamStats,
  report,
  fileSrc,
  youtubeId,
  videoRef,
  seekSeconds,
  seekNonce,
  goals,
  highlights,
  onSeek,
}: MatchFilmPanelProps) {
  const teamA = teamStats.find((team) => team.teamId === "A");
  const teamB = teamStats.find((team) => team.teamId === "B");
  const jumps: JumpEntry[] = [
    ...goals.map((goal) => ({
      timestamp: goal.timestamp,
      label: `Goal — ${jerseyDisplay(goal.scorerJerseyNumber).short} ${goal.scorerTeam}`,
      isGoal: true,
    })),
    ...highlights
      .filter((highlight) => highlight.importance >= 70 && highlight.type !== "goal")
      .map((highlight) => ({
        timestamp: highlight.startTimestamp,
        label: highlight.title,
        isGoal: false,
      })),
  ]
    .sort((a, b) => timeToSeconds(a.timestamp) - timeToSeconds(b.timestamp))
    .slice(0, 12);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="order-1 space-y-4 xl:order-2 xl:sticky xl:top-20 xl:self-start"
    >
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/60">
        {fileSrc ? (
          <video
            ref={videoRef}
            src={fileSrc}
            controls
            className="max-h-[45vh] w-full bg-black object-contain xl:max-h-none xl:aspect-video"
          />
        ) : youtubeId ? (
          <iframe
            key={seekNonce}
            src={`https://www.youtube.com/embed/${youtubeId}?start=${Math.floor(seekSeconds)}${
              seekNonce > 0 ? "&autoplay=1" : ""
            }`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full border-0 bg-black"
          />
        ) : null}

        <div className="flex items-center gap-2 px-4 py-2.5">
          <Film className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          <p className="truncate text-xs text-gray-400">{title}</p>
        </div>
      </div>

      {teamA && teamB && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="grid grid-cols-3 items-center gap-2">
            <p className={cn("truncate text-center text-xs font-medium", TEAM_COLORS.A.text)}>
              {teamA.teamName}
            </p>
            <p className="text-center text-2xl font-bold tabular-nums text-white">
              {report.teamAGoals} <span className="text-gray-600">–</span> {report.teamBGoals}
            </p>
            <p className={cn("truncate text-center text-xs font-medium", TEAM_COLORS.B.text)}>
              {teamB.teamName}
            </p>
          </div>

          <dl className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs">
            {[
              { label: "Possession", a: `${teamA.possessionPercent}%`, b: `${teamB.possessionPercent}%` },
              { label: "Shots (on target)", a: `${teamA.shots} (${teamA.shotsOnTarget})`, b: `${teamB.shots} (${teamB.shotsOnTarget})` },
              { label: "xG", a: teamA.xG.toFixed(2), b: teamB.xG.toFixed(2) },
              { label: "Pass accuracy", a: `${teamA.passAccuracy}%`, b: `${teamB.passAccuracy}%` },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-3 items-center gap-2">
                <dd className={cn("text-center tabular-nums", TEAM_COLORS.A.text)}>{row.a}</dd>
                <dt className="text-center text-gray-500">{row.label}</dt>
                <dd className={cn("text-center tabular-nums", TEAM_COLORS.B.text)}>{row.b}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {jumps.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-white">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Jump to a key moment
          </p>
          <div className="mt-3 max-h-44 space-y-1.5 overflow-y-auto pr-1 xl:max-h-72">
            {jumps.map((jump, index) => (
              <button
                key={`${jump.timestamp}-${index}`}
                type="button"
                onClick={() => onSeek(timeToSeconds(jump.timestamp))}
                className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-left transition-colors hover:border-indigo-500/40 hover:bg-white/10"
              >
                {jump.isGoal ? (
                  <GoalIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Play className="h-3 w-3 shrink-0 text-indigo-400" />
                )}
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium tabular-nums",
                    jump.isGoal ? "text-emerald-400" : "text-indigo-400"
                  )}
                >
                  {jump.timestamp}
                </span>
                <span className="truncate text-xs text-gray-300">{jump.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.aside>
  );
}
