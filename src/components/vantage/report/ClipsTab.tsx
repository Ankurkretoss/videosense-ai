"use client";

import { useMemo, useState } from "react";
import { Download, Film, Loader2, Play, Scissors } from "lucide-react";
import { Card } from "./report-bits";
import { Chip, PrimaryButton, SoftButton } from "@/components/vantage/ui";
import { downloadBlob } from "@/lib/clip";
import { clipWindowFor, type HighlightClipsState } from "@/hooks/useHighlightClips";
import { timeToSeconds } from "@/lib/time";
import type { Highlight, HighlightType } from "@/types/sports-analysis";
import { cn } from "@/lib/utils";

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

const TYPE_TONES: Partial<Record<HighlightType, { bg: string; fg: string }>> = {
  goal: { bg: "rgba(52,211,153,0.16)", fg: "#34D399" },
  "shot-on-target": { bg: "rgba(167,139,250,0.18)", fg: "#C3B2FF" },
  save: { bg: "rgba(251,191,36,0.16)", fg: "#FBBF24" },
  card: { bg: "rgba(248,113,113,0.16)", fg: "#F87171" },
  foul: { bg: "rgba(248,113,113,0.14)", fg: "#F87171" },
  penalty: { bg: "rgba(248,113,113,0.18)", fg: "#F87171" },
  skill: { bg: "rgba(139,107,255,0.18)", fg: "#C3B2FF" },
  dribble: { bg: "rgba(139,107,255,0.18)", fg: "#C3B2FF" },
  tackle: { bg: "rgba(96,165,250,0.16)", fg: "#60A5FA" },
  interception: { bg: "rgba(96,165,250,0.16)", fg: "#60A5FA" },
  mistake: { bg: "rgba(251,191,36,0.16)", fg: "#FBBF24" },
};

function tone(type: HighlightType) {
  return TYPE_TONES[type] ?? { bg: "rgba(255,255,255,0.06)", fg: "#C0C0CC" };
}

function windowLength(highlight: Highlight): string {
  const length = Math.max(
    1,
    Math.round(timeToSeconds(highlight.endTimestamp) - timeToSeconds(highlight.startTimestamp))
  );
  return `${length}s`;
}

interface ClipsTabProps {
  highlights: Highlight[];
  clipState: HighlightClipsState;
  hasSourceFile: boolean;
  onSeek?: (seconds: number) => void;
}

export function ClipsTab({ highlights, clipState, hasSourceFile, onSeek }: ClipsTabProps) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [playerFilter, setPlayerFilter] = useState("all");

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

  const totalSeconds = visible.reduce(
    (sum, highlight) =>
      sum + (timeToSeconds(highlight.endTimestamp) - timeToSeconds(highlight.startTimestamp)),
    0
  );

  const typeOptions = [
    { value: "all", label: "All", count: highlights.length },
    ...Array.from(new Set(highlights.map((highlight) => highlight.type))).map((type) => ({
      value: type,
      label: TYPE_LABELS[type],
      count: highlights.filter((highlight) => highlight.type === type).length,
    })),
  ];

  const reelName =
    playerFilter !== "all"
      ? `player-${playerFilter}-highlights.mp4`
      : typeFilter !== "all"
        ? `${typeFilter}-reel.mp4`
        : "match-highlights.mp4";

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[15px] font-bold">Every important moment. Automatically found.</div>
          <div className="font-mono-num mt-1 text-[12.5px] text-mute-3">
            {visible.length} clips · {Math.floor(totalSeconds / 60)}:
            {String(Math.round(totalSeconds % 60)).padStart(2, "0")} total
            {hasSourceFile && ` · ${clipState.readyCount}/${clipState.total} cut`}
          </div>
        </div>
        {hasSourceFile && (
          <div className="flex flex-wrap items-center gap-2">
            <PrimaryButton
              onClick={() => clipState.downloadZip(visible)}
              disabled={clipState.busy !== null}
              className="px-4 py-2.5 text-[13px]"
            >
              <Download className="h-3.5 w-3.5" />
              Download {visible.length} as ZIP
            </PrimaryButton>
            <SoftButton
              onClick={() => clipState.buildReel(visible, reelName)}
              disabled={clipState.busy !== null}
              className="px-4 py-2.5 text-[13px]"
            >
              <Film className="h-3.5 w-3.5" />
              {playerFilter !== "all" ? `#${playerFilter} reel` : "Highlight reel"}
            </SoftButton>
          </div>
        )}
      </div>

      <div className="mb-3.5 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {typeOptions.map((option) => (
            <Chip
              key={option.value}
              active={typeFilter === option.value}
              onClick={() => setTypeFilter(option.value)}
            >
              {option.label}
              <span className="font-mono-num ml-1.5 text-mute-3">{option.count}</span>
            </Chip>
          ))}
        </div>
        {players.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Chip active={playerFilter === "all"} onClick={() => setPlayerFilter("all")}>
              All players
            </Chip>
            {players.map((player) => (
              <Chip
                key={player}
                active={playerFilter === player}
                onClick={() => setPlayerFilter(player)}
              >
                #{player}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {clipState.busy !== null && (
        <Card className="mb-3.5 flex flex-wrap items-center gap-3 p-3.5 text-[12.5px] text-mute">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          <span className="min-w-0 flex-1 truncate">{clipState.statusText || "Cutting clips…"}</span>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#6B49FF] to-[#A78BFA]"
              style={{ width: `${Math.round(clipState.progress * 100)}%` }}
            />
          </div>
          <button type="button" onClick={clipState.cancel} className="text-mute-3 hover:text-bad">
            cancel
          </button>
        </Card>
      )}

      {clipState.error && (
        <Card className="mb-3.5 border-bad/30 bg-bad/[0.08] p-3.5 text-[12.5px] text-bad">
          {clipState.error}
        </Card>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-stretch gap-4">
        {visible.map((highlight) => {
          const clip = clipState.clips[highlight.id];
          const badge = tone(highlight.type);
          const cutting = clipState.busy === highlight.id;

          return (
            <Card
              key={highlight.id}
              className="overflow-hidden transition-colors hover:border-brand/45"
            >
              <div className="hatch relative aspect-video">
                {clip ? (
                  <video src={clip.url} controls className="h-full w-full bg-black" />
                ) : (
                  <>
                    <div className="absolute inset-0 grid place-items-center">
                      <button
                        type="button"
                        onClick={() => onSeek?.(timeToSeconds(highlight.startTimestamp))}
                        className="grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-ink/70 text-white transition-colors hover:border-brand/60"
                        aria-label="Play from this moment"
                      >
                        {cutting || clipState.autoRunning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    {hasSourceFile && (
                      <span className="font-mono-num absolute inset-x-0 bottom-2 text-center text-[10.5px] text-mute-2">
                        {cutting ? "cutting…" : clipState.autoRunning ? "queued" : "not cut yet"}
                      </span>
                    )}
                  </>
                )}
                <span
                  className="absolute top-2.5 left-2.5 rounded-md px-2 py-1 text-[10.5px] font-bold tracking-[0.06em] uppercase"
                  style={{ background: badge.bg, color: badge.fg }}
                >
                  {TYPE_LABELS[highlight.type]}
                </span>
                <span className="font-mono-num absolute right-2.5 bottom-2.5 rounded-[5px] bg-ink/80 px-1.5 py-0.5 text-[11px] text-ink-300">
                  {highlight.startTimestamp}
                </span>
              </div>

              <div className="p-3.5">
                <div className="text-[14.5px] font-bold">{highlight.title}</div>
                <div className="mt-1 text-[12px] text-mute-2">
                  {highlight.team || "—"} · {windowLength(highlight)}
                  {highlight.playersInvolved.length > 0 &&
                    ` · ${highlight.playersInvolved.map((p) => `#${p.replace(/^#/, "")}`).join(" ")}`}
                </div>
                <p className="mt-2 text-[12.5px] leading-[1.5] text-mute">{highlight.description}</p>

                <div className="mt-3 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSeek?.(timeToSeconds(highlight.startTimestamp))}
                    disabled={!onSeek}
                    className="flex-1 rounded-lg bg-brand/[0.14] py-2 text-[11.5px] font-semibold text-brand-soft transition-colors hover:bg-brand/20 disabled:opacity-50"
                  >
                    Watch
                  </button>
                  {clip ? (
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob(clip.blob, `${clipWindowFor(highlight).label}.mp4`)
                      }
                      className="flex-1 rounded-lg bg-white/[0.05] py-2 text-[11.5px] font-semibold text-ink-400 transition-colors hover:bg-white/10"
                    >
                      Download
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => clipState.generateOne(highlight)}
                      disabled={!hasSourceFile || clipState.busy !== null}
                      className={cn(
                        "flex-1 rounded-lg bg-white/[0.05] py-2 text-[11.5px] font-semibold text-ink-400 transition-colors hover:bg-white/10",
                        (!hasSourceFile || clipState.busy !== null) && "opacity-50"
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Scissors className="h-3 w-3" />
                        Cut clip
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
