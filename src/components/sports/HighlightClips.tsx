"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Clapperboard,
  Download,
  ExternalLink,
  Film,
  Loader2,
  Play,
  Scissors,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard, FilterChips, jerseyDisplay } from "./report-ui";
import { downloadBlob, slugifyFilename } from "@/lib/clip";
import { clipWindowFor, type HighlightClipsState } from "@/hooks/useHighlightClips";
import { timeToSeconds } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Highlight, HighlightType } from "@/types/sports-analysis";

interface HighlightClipsProps {
  highlights: Highlight[];
  sourceFile: File | null;
  youtubeUrl: string | null;
  /** Clip queue owned by the page, so cutting runs regardless of the active tab. */
  clipState: HighlightClipsState;
  onSeek?: (seconds: number) => void;
}

const TYPE_LABELS: Record<HighlightType, string> = {
  goal: "Goal",
  "shot-on-target": "Shot on target",
  "shot-off-target": "Shot off target",
  "key-pass": "Key pass",
  "long-pass": "Long pass",
  cross: "Cross",
  save: "Save",
  foul: "Foul",
  card: "Card",
  skill: "Skill move",
  dribble: "Dribble",
  tackle: "Tackle",
  interception: "Interception",
  corner: "Corner",
  "free-kick": "Free kick",
  penalty: "Penalty",
  celebration: "Celebration",
  "fast-break": "Fast break",
  mistake: "Mistake",
  other: "Moment",
};

const TYPE_STYLES: Partial<Record<HighlightType, string>> = {
  goal: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  "shot-on-target": "border-indigo-500/50 bg-indigo-500/10 text-indigo-400",
  "shot-off-target": "border-gray-500/50 bg-gray-500/10 text-gray-300",
  "key-pass": "border-sky-500/50 bg-sky-500/10 text-sky-400",
  "long-pass": "border-sky-500/50 bg-sky-500/10 text-sky-400",
  cross: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
  save: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  foul: "border-orange-500/50 bg-orange-500/10 text-orange-400",
  card: "border-red-500/50 bg-red-500/10 text-red-400",
  skill: "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-400",
  dribble: "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-400",
  tackle: "border-lime-500/50 bg-lime-500/10 text-lime-400",
  interception: "border-lime-500/50 bg-lime-500/10 text-lime-400",
  penalty: "border-rose-500/50 bg-rose-500/10 text-rose-400",
  celebration: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  mistake: "border-amber-500/50 bg-amber-500/10 text-amber-300",
};

export function HighlightClips({
  highlights,
  sourceFile,
  youtubeUrl,
  clipState,
  onSeek,
}: HighlightClipsProps) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [playerFilter, setPlayerFilter] = useState("all");
  const {
    clips,
    busy,
    progress,
    statusText,
    error,
    readyCount,
    autoRunning,
    generateOne,
    downloadZip,
    buildReel,
    cancel,
  } = clipState;

  const players = useMemo(() => {
    const seen = new Set<string>();
    highlights.forEach((highlight) =>
      highlight.playersInvolved.forEach((player) => seen.add(player.replace(/^#/, "")))
    );
    return Array.from(seen).sort((a, b) => (parseInt(a, 10) || 999) - (parseInt(b, 10) || 999));
  }, [highlights]);

  const visible = useMemo(
    () =>
      highlights.filter((highlight) => {
        const typeMatch = typeFilter === "all" || highlight.type === typeFilter;
        const playerMatch =
          playerFilter === "all" ||
          highlight.playersInvolved.some((player) => player.replace(/^#/, "") === playerFilter);
        return typeMatch && playerMatch;
      }),
    [highlights, typeFilter, playerFilter]
  );

  if (highlights.length === 0) return null;

  const typeOptions = [
    { value: "all", label: "All", count: highlights.length },
    ...Array.from(new Set(highlights.map((highlight) => highlight.type))).map((type) => ({
      value: type,
      label: TYPE_LABELS[type],
      count: highlights.filter((highlight) => highlight.type === type).length,
    })),
  ];

  const reelFilename =
    playerFilter !== "all"
      ? `player-${slugifyFilename(playerFilter)}-highlights.mp4`
      : typeFilter !== "all"
        ? `${slugifyFilename(TYPE_LABELS[typeFilter as HighlightType])}-reel.mp4`
        : "match-highlights.mp4";

  return (
    <SectionCard
      title={`Highlight clips (${highlights.length})`}
      icon={<Clapperboard className="h-5 w-5 text-indigo-400" />}
      description={
        sourceFile
          ? "Every moment is cut from your video automatically — just download the ones you want."
          : "Clip cutting needs the original file — for YouTube, jump to the timestamp instead."
      }
    >
      <div className="space-y-3">
        <FilterChips options={typeOptions} value={typeFilter} onChange={setTypeFilter} />
        {players.length > 0 && (
          <FilterChips
            options={[
              { value: "all", label: "All players" },
              ...players.map((player) => ({
                value: player,
                label: jerseyDisplay(player).short,
                count: highlights.filter((highlight) =>
                  highlight.playersInvolved.some((involved) => involved.replace(/^#/, "") === player)
                ).length,
              })),
            ]}
            value={playerFilter}
            onChange={setPlayerFilter}
          />
        )}
      </div>

      {sourceFile && visible.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
          <span className="mr-1 text-xs text-gray-400">
            {readyCount === highlights.length
              ? `All ${highlights.length} clips ready`
              : `${readyCount} of ${highlights.length} clips ready`}
          </span>
          <Button
            size="sm"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => downloadZip(visible)}
            disabled={busy !== null}
          >
            <Download className="h-3.5 w-3.5" />
            Download {visible.length} clips as ZIP
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 bg-white/5 text-white"
            onClick={() => buildReel(visible, reelFilename)}
            disabled={busy !== null}
          >
            <Film className="h-3.5 w-3.5" />
            {playerFilter !== "all"
              ? `Build ${jerseyDisplay(playerFilter).short} reel`
              : "Build highlight reel"}
          </Button>

          {busy !== null && (
            <div className="flex min-w-48 flex-1 items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              <span className="truncate">{statusText || "Working..."}</span>
              <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <button
                type="button"
                className="text-gray-500 hover:text-white"
                onClick={cancel}
              >
                cancel
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-4 grid items-start gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {visible.map((highlight, index) => {
          const clip = clips[highlight.id];
          const isCutting = busy === highlight.id;
          const youtubeTimestampUrl = youtubeUrl
            ? `${youtubeUrl}${youtubeUrl.includes("?") ? "&" : "?"}t=${Math.floor(
                timeToSeconds(highlight.startTimestamp)
              )}s`
            : null;

          return (
            <motion.div
              key={highlight.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("text-xs", TYPE_STYLES[highlight.type] ?? "border-white/20 bg-white/5 text-gray-300")}
                >
                  {TYPE_LABELS[highlight.type]}
                </Badge>
                <button
                  type="button"
                  disabled={!onSeek}
                  onClick={() => onSeek?.(timeToSeconds(highlight.startTimestamp))}
                  className={cn(
                    "text-sm font-medium text-indigo-400",
                    onSeek && "hover:text-indigo-300 hover:underline"
                  )}
                >
                  {highlight.startTimestamp} – {highlight.endTimestamp}
                </button>
                {highlight.importance >= 70 && (
                  <Badge variant="secondary" className="bg-amber-500/10 text-xs text-amber-300">
                    key moment
                  </Badge>
                )}
                {highlight.team && (
                  <span className="text-xs text-gray-500">{highlight.team}</span>
                )}
              </div>

              <h4 className="mt-2 font-medium text-white">{highlight.title}</h4>
              <p className="mt-1 text-sm text-gray-400">{highlight.description}</p>

              {highlight.playersInvolved.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-gray-500" />
                  {highlight.playersInvolved.map((player, playerIndex) => (
                    <Badge
                      key={playerIndex}
                      variant="secondary"
                      className="bg-white/10 text-xs text-gray-300"
                    >
                      {jerseyDisplay(player.replace(/^#/, "")).short}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {onSeek && (
                  <Button
                    size="sm"
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                    onClick={() => onSeek(timeToSeconds(highlight.startTimestamp))}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Play from {highlight.startTimestamp}
                  </Button>
                )}

                {sourceFile ? (
                  clip ? (
                    <div className="w-full space-y-2">
                      <video src={clip.url} controls className="w-full rounded-lg" />
                      <Button
                        size="sm"
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                        onClick={() =>
                          downloadBlob(clip.blob, `${clipWindowFor(highlight).label}.mp4`)
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download clip
                      </Button>
                    </div>
                  ) : isCutting ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      Cutting clip... {Math.round(progress * 100)}%
                    </div>
                  ) : autoRunning ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      Queued for cutting...
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white"
                      onClick={() => generateOne(highlight)}
                      disabled={busy !== null}
                    >
                      <Scissors className="h-3.5 w-3.5" />
                      Generate clip
                    </Button>
                  )
                ) : youtubeTimestampUrl ? (
                  <a href={youtubeTimestampUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Watch at {highlight.startTimestamp}
                    </Button>
                  </a>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>
    </SectionCard>
  );
}
