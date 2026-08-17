"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, StatCell, BarRow, SectionEyebrow } from "./report-bits";
import { Chip } from "@/components/vantage/ui";
import type { SportsAnalysis, SportsPlayer } from "@/types/sports-analysis";
import { cn } from "@/lib/utils";

const SORTS = ["Best rated", "Most decisive", "Most running", "Jersey"] as const;

function ratingTone(rating: number): string {
  if (rating >= 7.5) return "text-good";
  if (rating >= 6) return "text-warn";
  return "text-bad";
}

function jerseyLabel(value: string): string {
  if (!value || /^unknown$/i.test(value)) return "#?";
  if (/^\d{1,3}$/.test(value)) return `#${value}`;
  const counter = value.match(/(\d{1,2})\s*$/);
  return counter ? `#?${counter[1]}` : "#?";
}

function PlayerCard({ player }: { player: SportsPlayer }) {
  const [showNote, setShowNote] = useState(false);
  const stats = [
    { k: "Touches", v: player.stats.touches },
    { k: "Passes", v: `${player.stats.passesCompleted}/${player.stats.passesAttempted}` },
    { k: "Shots", v: player.stats.shots },
    { k: "Goals", v: player.stats.goals },
    { k: "Distance", v: `${(player.tracking.distanceCoveredM / 1000).toFixed(1)} km` },
    { k: "Sprints", v: player.tracking.sprintCount },
  ];

  const bars = [
    { k: "Attacking", v: player.ratings.attack * 10 },
    { k: "Movement", v: player.ratings.movement * 10 },
    { k: "Passing", v: player.ratings.passing * 10 },
    { k: "Work rate", v: player.ratings.workRate * 10 },
  ];

  return (
    <Card className="flex h-full flex-col p-[18px]">
      <div className="flex items-center gap-3">
        <div
          className="font-mono-num grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl text-[13px] text-brand-soft"
          style={{
            background: "repeating-linear-gradient(135deg, #1A1A22 0 6px, #14141B 6px 12px)",
          }}
        >
          {jerseyLabel(player.jerseyNumber)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-bold">
            {player.position || (player.isGoalkeeper ? "Goalkeeper" : "Outfield")}
          </div>
          <div className="mt-0.5 truncate text-[12px] text-mute-2">
            {player.team} · {player.footPreference !== "unknown" ? `${player.footPreference}-footed` : "foot unknown"}
            {player.isCaptain ? " · captain" : ""}
          </div>
        </div>
        <div className="text-right">
          <div className={cn("font-mono-num text-[22px] font-semibold", ratingTone(player.ratings.overall))}>
            {player.ratings.overall.toFixed(1)}
          </div>
          <div className="text-[10.5px] tracking-[0.08em] text-mute-3">RATING</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <StatCell key={stat.k} value={stat.v} label={stat.k} />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {bars.map((bar) => (
          <BarRow key={bar.k} label={bar.k} value={bar.v} />
        ))}
      </div>

      {(player.scouting.strengths.length > 0 || player.scouting.weaknesses.length > 0) && (
        <div className="mt-4 grid gap-2.5 border-t border-white/[0.09] pt-3.5 sm:grid-cols-2">
          <div>
            <SectionEyebrow color="#34D399">Strengths</SectionEyebrow>
            <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-[1.5] text-ink-400">
              {player.scouting.strengths.join(" ") || "—"}
            </p>
          </div>
          <div>
            <SectionEyebrow color="#F87171">Watch-outs</SectionEyebrow>
            <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-[1.5] text-ink-400">
              {player.scouting.weaknesses.join(" ") || "—"}
            </p>
          </div>
        </div>
      )}

      {(player.scouting.summary || player.scouting.coachingNote) && (
        <div className="mt-3.5 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setShowNote((open) => !open)}
            className="flex w-full items-center justify-between text-[11.5px] font-semibold text-brand-soft"
          >
            {showNote ? "Hide scouting note" : "Full scouting note"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showNote && "rotate-180")} />
          </button>

          {showNote && (
            <div className="mt-2.5 flex flex-col gap-2">
              {player.scouting.summary && (
                <p className="rounded-[10px] bg-white/[0.03] p-3 text-[12.5px] leading-[1.55] text-mute">
                  {player.scouting.summary}
                </p>
              )}
              {player.scouting.standoutMoments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {player.scouting.standoutMoments.map((moment, index) => (
                    <span
                      key={index}
                      className="font-mono-num rounded-md bg-white/[0.04] px-2 py-1 text-[10.5px] text-mute"
                    >
                      {moment}
                    </span>
                  ))}
                </div>
              )}
              {player.scouting.coachingNote && (
                <p className="text-[12px] leading-[1.5] text-brand-soft">
                  Coaching note: {player.scouting.coachingNote}
                </p>
              )}
              {player.ratings.justification && (
                <p className="text-[12px] leading-[1.5] text-mute-2">{player.ratings.justification}</p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function PlayersTab({ analysis }: { analysis: SportsAnalysis }) {
  const [team, setTeam] = useState("all");
  const [sort, setSort] = useState<string>(SORTS[0]);

  const teams = [
    { value: "all", label: "Both teams", count: analysis.players.length },
    {
      value: "A",
      label: analysis.playerCount.teamA.name,
      count: analysis.players.filter((p) => p.teamId === "A").length,
    },
    {
      value: "B",
      label: analysis.playerCount.teamB.name,
      count: analysis.players.filter((p) => p.teamId === "B").length,
    },
  ];

  const visible = useMemo(() => {
    const rows = team === "all" ? [...analysis.players] : analysis.players.filter((p) => p.teamId === team);

    if (sort === "Most decisive")
      rows.sort(
        (a, b) =>
          b.stats.goals * 3 + b.stats.assists * 2 + b.stats.shotsOnTarget -
          (a.stats.goals * 3 + a.stats.assists * 2 + a.stats.shotsOnTarget)
      );
    else if (sort === "Most running")
      rows.sort((a, b) => b.tracking.distanceCoveredM - a.tracking.distanceCoveredM);
    else if (sort === "Jersey")
      rows.sort((a, b) => (parseInt(a.jerseyNumber, 10) || 999) - (parseInt(b.jerseyNumber, 10) || 999));
    else rows.sort((a, b) => b.ratings.overall - a.ratings.overall);

    return rows;
  }, [analysis.players, team, sort]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {teams.map((item) => (
            <Chip key={item.value} active={team === item.value} onClick={() => setTeam(item.value)}>
              {item.label}
              <span className="ml-1.5 text-mute-3">{item.count}</span>
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SORTS.map((item) => (
            <Chip key={item} active={sort === item} onClick={() => setSort(item)}>
              {item}
            </Chip>
          ))}
        </div>
      </div>

      {analysis.awards.length > 0 && (
        <Card className="mb-4 p-[18px]">
          <SectionEyebrow color="#C3B2FF">Standout performers</SectionEyebrow>
          <div className="mt-3.5 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2.5">
            {analysis.awards.map((award, index) => (
              <div
                key={`${award.category}-${index}`}
                className="rounded-[11px] border border-white/[0.05] bg-white/[0.03] p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono-num text-[12px] text-brand-soft">
                    {jerseyLabel(award.jerseyNumber)}
                  </span>
                  <span className="text-[13px] font-semibold text-ink-200">{award.category}</span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-[1.5] text-mute">{award.reason}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] items-stretch gap-4">
        {visible.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}
