"use client";

import type { RefObject } from "react";
import { Play } from "lucide-react";
import { Card, CardTitle, EVENT_COLORS, SectionEyebrow, VersusRow } from "./report-bits";
import { YouTubeMoment } from "@/components/vantage/YouTubeMoment";
import { timeToSeconds } from "@/lib/time";
import type { SportsAnalysis } from "@/types/sports-analysis";

interface OverviewTabProps {
  analysis: SportsAnalysis;
  fileSrc?: string | null;
  youtubeId?: string | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  embedSeek: { seconds: number; nonce: number };
  onSeek?: (seconds: number) => void;
}

function markColor(type: string): string {
  const key = type.toLowerCase();
  if (key.includes("goal")) return EVENT_COLORS.goal;
  if (key.includes("save")) return EVENT_COLORS.save;
  if (key.includes("card") || key.includes("foul")) return EVENT_COLORS.card;
  if (key.includes("shot")) return EVENT_COLORS.shot;
  if (key.includes("corner") || key.includes("free")) return EVENT_COLORS.defensive;
  return EVENT_COLORS.other;
}

export function OverviewTab({
  analysis,
  fileSrc,
  youtubeId,
  videoRef,
  embedSeek,
  onSeek,
}: OverviewTabProps) {
  const durationSeconds = timeToSeconds(analysis.videoInfo.duration || analysis.metadata.duration);
  const [teamA, teamB] = analysis.teamStats;

  const metrics = teamA && teamB
    ? [
        { label: "Possession", a: `${teamA.possessionPercent}%`, b: `${teamB.possessionPercent}%`, pa: teamA.possessionPercent, pb: teamB.possessionPercent },
        { label: "Shots", a: String(teamA.shots), b: String(teamB.shots), pa: teamA.shots, pb: teamB.shots },
        { label: "Shots on target", a: String(teamA.shotsOnTarget), b: String(teamB.shotsOnTarget), pa: teamA.shotsOnTarget, pb: teamB.shotsOnTarget },
        { label: "Big chances", a: String(teamA.bigChances), b: String(teamB.bigChances), pa: teamA.bigChances, pb: teamB.bigChances },
        { label: "Expected goals", a: teamA.xG.toFixed(2), b: teamB.xG.toFixed(2), pa: teamA.xG, pb: teamB.xG },
        { label: "Pass accuracy", a: `${teamA.passAccuracy}%`, b: `${teamB.passAccuracy}%`, pa: teamA.passAccuracy, pb: teamB.passAccuracy },
        { label: "Passes completed", a: String(teamA.passesCompleted), b: String(teamB.passesCompleted), pa: teamA.passesCompleted, pb: teamB.passesCompleted },
        { label: "Tackles", a: String(teamA.tackles), b: String(teamB.tackles), pa: teamA.tackles, pb: teamB.tackles },
        { label: "Interceptions", a: String(teamA.interceptions), b: String(teamB.interceptions), pa: teamA.interceptions, pb: teamB.interceptions },
        { label: "Fouls", a: String(teamA.fouls), b: String(teamB.fouls), pa: teamA.fouls, pb: teamB.fouls },
        { label: "Cards", a: String(teamA.yellowCards + teamA.redCards), b: String(teamB.yellowCards + teamB.redCards), pa: teamA.yellowCards + teamA.redCards, pb: teamB.yellowCards + teamB.redCards },
        { label: "Distance", a: `${teamA.distanceCoveredKm.toFixed(1)} km`, b: `${teamB.distanceCoveredKm.toFixed(1)} km`, pa: teamA.distanceCoveredKm, pb: teamB.distanceCoveredKm },
      ]
    : [];

  const scale = (value: number, other: number) => {
    const peak = Math.max(value, other, 1);
    return (value / peak) * 100;
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Card className="overflow-hidden">
          <div
            className="relative aspect-video"
            style={{
              background: "repeating-linear-gradient(115deg, #14251A 0 14px, #101F16 14px 28px)",
            }}
          >
            {fileSrc ? (
              <video ref={videoRef} src={fileSrc} controls className="h-full w-full bg-black" />
            ) : youtubeId ? (
              <YouTubeMoment
                key={embedSeek.nonce}
                videoId={youtubeId}
                startSeconds={embedSeek.seconds}
                title={analysis.metadata.title}
                autoplay={embedSeek.nonce > 0}
                className="h-full w-full"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.7),transparent_55%)]" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="grid h-[52px] w-[52px] place-items-center rounded-full border border-white/25 bg-ink/70">
                    <Play className="h-4 w-4" />
                  </div>
                </div>
                <p className="font-mono-num absolute inset-x-0 bottom-14 text-center text-[11px] text-mute-2">
                  original footage not attached to this saved report
                </p>
              </>
            )}
          </div>

          {/* Event timeline strip */}
          <div className="p-3.5">
            <div className="relative h-[22px]">
              <div className="absolute inset-x-0 top-2.5 h-[3px] rounded-sm bg-white/[0.18]" />
              {analysis.timeline.map((event, index) => {
                const at = durationSeconds
                  ? (timeToSeconds(event.timestamp) / durationSeconds) * 100
                  : 0;
                return (
                  <button
                    key={`${event.timestamp}-${index}`}
                    type="button"
                    title={`${event.timestamp} · ${event.title}`}
                    onClick={() => onSeek?.(timeToSeconds(event.timestamp))}
                    className="absolute top-1 h-3.5 w-[3px] rounded-sm transition-transform hover:scale-y-125"
                    style={{ left: `${Math.min(99, Math.max(0, at))}%`, background: markColor(event.type) }}
                  />
                );
              })}
            </div>
            <div className="font-mono-num mt-1 flex justify-between text-[11px] text-ink-400">
              <span>00:00</span>
              <span className="text-mute-3">
                {onSeek ? "Click any event marker to jump" : "timeline of detected events"}
              </span>
              <span>{analysis.videoInfo.duration || analysis.metadata.duration}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <CardTitle>
            Team comparison · {teamA?.teamName ?? "Team A"} vs {teamB?.teamName ?? "Team B"}
          </CardTitle>
          <div className="mt-4 flex flex-col gap-3.5">
            {metrics.map((metric) => (
              <VersusRow
                key={metric.label}
                label={metric.label}
                left={metric.a}
                right={metric.b}
                leftPercent={scale(metric.pa, metric.pb)}
                rightPercent={scale(metric.pb, metric.pa)}
              />
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="border-brand/[0.28] bg-gradient-to-b from-brand/10 to-brand/[0.02] p-[18px]">
          <SectionEyebrow color="#C3B2FF">AI match summary</SectionEyebrow>
          <p className="mt-3 text-[14px] leading-[1.6] text-ink-300">
            {analysis.matchSummary.detailed || analysis.matchSummary.short}
          </p>
        </Card>

        {analysis.matchSummary.phases.length > 0 && (
          <Card className="p-[18px]">
            <CardTitle>How the match unfolded</CardTitle>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {analysis.matchSummary.phases.map((phase, index) => (
                <div
                  key={index}
                  className="rounded-[11px] border border-white/[0.05] bg-white/[0.03] p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-num text-[11px] text-brand">{phase.range}</span>
                    <span className="text-[13px] font-semibold text-ink-200">{phase.title}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-[1.55] text-mute">{phase.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="flex-1 p-[18px]">
          <CardTitle>Recommended improvements</CardTitle>
          <div className="mt-3.5 flex flex-col gap-2.5">
            {analysis.improvements.length === 0 && (
              <p className="text-[13px] text-mute-3">No coaching points were produced.</p>
            )}
            {analysis.improvements.slice(0, 6).map((item, index) => (
              <div
                key={index}
                className="flex gap-2.5 rounded-[11px] border border-white/[0.05] bg-white/[0.03] p-3"
              >
                <span className="font-mono-num shrink-0 text-[11px] text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[13px] leading-[1.55] text-ink-300">
                  {item.issue}
                  {item.recommendation ? ` ${item.recommendation}` : ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
