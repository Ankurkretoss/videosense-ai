"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Crown, Footprints, Gauge, Lightbulb, Ruler, Shirt, Timer } from "lucide-react";
import {
  SectionCard,
  FilterChips,
  JerseyBadge,
  RatingBar,
  StatTile,
  TEAM_COLORS,
  jerseyDisplay,
} from "./report-ui";
import { cn } from "@/lib/utils";
import type { SportsPlayer } from "@/types/sports-analysis";

interface PlayerRosterProps {
  players: SportsPlayer[];
  teamAName: string;
  teamBName: string;
}

type SortKey = "rating" | "jersey" | "distance" | "goals";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "rating", label: "Best rated" },
  { value: "goals", label: "Most decisive" },
  { value: "distance", label: "Most running" },
  { value: "jersey", label: "Jersey number" },
];

function sortPlayers(players: SportsPlayer[], key: SortKey): SportsPlayer[] {
  const sorted = [...players];
  switch (key) {
    case "jersey":
      return sorted.sort(
        (a, b) => (parseInt(a.jerseyNumber, 10) || 999) - (parseInt(b.jerseyNumber, 10) || 999)
      );
    case "distance":
      return sorted.sort((a, b) => b.tracking.distanceCoveredM - a.tracking.distanceCoveredM);
    case "goals":
      return sorted.sort(
        (a, b) =>
          b.stats.goals * 3 + b.stats.assists * 2 + b.stats.shotsOnTarget -
          (a.stats.goals * 3 + a.stats.assists * 2 + a.stats.shotsOnTarget)
      );
    default:
      return sorted.sort((a, b) => b.ratings.overall - a.ratings.overall);
  }
}

function PlayerCard({ player, defaultOpen }: { player: SportsPlayer; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const colors = TEAM_COLORS[player.teamId];
  const jersey = jerseyDisplay(player.jerseyNumber);

  return (
    <div className={cn("rounded-xl border bg-white/5 transition-colors", open ? colors.border : "border-white/10")}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <JerseyBadge number={player.jerseyNumber} teamId={player.teamId} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-white">
            {player.position || (player.isGoalkeeper ? "Goalkeeper" : "Outfield")}
            {player.isCaptain && <Crown className="h-3.5 w-3.5 text-amber-400" />}
          </p>
          <p className="truncate text-xs text-gray-500">
            {jersey.label}
            {" · "}
            {player.footPreference !== "unknown" ? `${player.footPreference}-footed` : "foot unknown"}
            {player.estimatedHeight ? ` · ${player.estimatedHeight}` : ""} · {player.confidence}% confidence
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-lg font-semibold tabular-nums", colors.text)}>
            {player.ratings.overall.toFixed(1)}
          </p>
          <p className="text-[11px] text-gray-500">rating</p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-gray-500 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden border-t border-white/10 p-3"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Touches" value={player.stats.touches} />
            <StatTile
              label="Passes"
              value={`${player.stats.passesCompleted}/${player.stats.passesAttempted}`}
              hint={`${player.stats.passAccuracy}% accurate`}
            />
            <StatTile
              label="Shots"
              value={player.stats.shots}
              hint={`${player.stats.shotsOnTarget} on target`}
            />
            <StatTile
              label="G / A"
              value={`${player.stats.goals} / ${player.stats.assists}`}
              accent="text-emerald-400"
            />
            <StatTile label="Tackles" value={player.stats.tackles} />
            <StatTile label="Interceptions" value={player.stats.interceptions} />
            <StatTile label="Clearances" value={player.stats.clearances} />
            <StatTile label="Duels won" value={player.stats.duelsWon} />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-medium text-gray-400">Physical tracking</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Footprints className="h-3.5 w-3.5 text-gray-500" />
                  {(player.tracking.distanceCoveredM / 1000).toFixed(2)} km
                </span>
                <span className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-gray-500" />
                  {player.tracking.topSpeedKmh} km/h top
                </span>
                <span className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-gray-500" />
                  {Math.round(player.tracking.possessionTimeSec)}s on the ball
                </span>
                <span className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-gray-500" />
                  {player.tracking.sprintCount} sprints
                </span>
              </div>
              <div className="flex gap-1 pt-1 text-[11px] text-gray-500">
                <span>{Math.round(player.tracking.timeOnScreenSec)}s on screen</span>
                <span>·</span>
                <span>{Math.round(player.tracking.walkingTimeSec)}s walking</span>
                <span>·</span>
                <span>{Math.round(player.tracking.standingTimeSec)}s standing</span>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-medium text-gray-400">Performance ratings</p>
              <RatingBar label="Attack" value={player.ratings.attack} />
              <RatingBar label="Passing" value={player.ratings.passing} />
              <RatingBar label="Defending" value={player.ratings.defending} />
              <RatingBar label="Positioning" value={player.ratings.positioning} />
              <RatingBar label="Movement" value={player.ratings.movement} />
              <RatingBar label="Vision" value={player.ratings.vision} />
              <RatingBar label="Decision making" value={player.ratings.decisionMaking} />
              <RatingBar label="Ball control" value={player.ratings.ballControl} />
              <RatingBar label="Work rate" value={player.ratings.workRate} />
            </div>
          </div>

          {player.scouting.summary && (
            <div className="mt-3 rounded-lg bg-black/20 p-3">
              <p className="text-xs font-medium text-gray-400">Scouting report</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-300">
                {player.scouting.summary}
              </p>
            </div>
          )}

          {(player.scouting.strengths.length > 0 || player.scouting.weaknesses.length > 0) && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {player.scouting.strengths.length > 0 && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs font-medium text-emerald-300">Strengths</p>
                  <ul className="mt-1.5 space-y-1">
                    {player.scouting.strengths.map((item, index) => (
                      <li key={index} className="text-xs text-gray-300">
                        + {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {player.scouting.weaknesses.length > 0 && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                  <p className="text-xs font-medium text-rose-300">Weaknesses</p>
                  <ul className="mt-1.5 space-y-1">
                    {player.scouting.weaknesses.map((item, index) => (
                      <li key={index} className="text-xs text-gray-300">
                        − {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {player.scouting.standoutMoments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {player.scouting.standoutMoments.map((moment, index) => (
                <span
                  key={index}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-400"
                >
                  {moment}
                </span>
              ))}
            </div>
          )}

          {player.scouting.coachingNote && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100/85">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              {player.scouting.coachingNote}
            </p>
          )}

          {player.ratings.justification &&
            player.ratings.justification !== player.scouting.summary && (
              <p className="mt-3 rounded-lg bg-black/20 p-3 text-sm text-gray-300">
                {player.ratings.justification}
              </p>
            )}

          {player.notes && <p className="mt-2 text-xs text-gray-500">{player.notes}</p>}

          <p className="mt-2 text-[11px] text-gray-600">
            Kit: {player.jerseyColor || "—"} shirt · {player.shortsColor || "—"} shorts ·{" "}
            {player.socksColor || "—"} socks
          </p>
        </motion.div>
      )}
    </div>
  );
}

export function PlayerRoster({ players, teamAName, teamBName }: PlayerRosterProps) {
  const [team, setTeam] = useState("all");
  const [sort, setSort] = useState<SortKey>("rating");

  const visible = useMemo(() => {
    const filtered =
      team === "all" ? players : players.filter((player) => player.teamId === team);
    return sortPlayers(filtered, sort);
  }, [players, team, sort]);

  if (players.length === 0) return null;

  return (
    <SectionCard
      title={`Players detected (${players.length})`}
      icon={<Shirt className="h-5 w-5 text-indigo-400" />}
      description="Tracking data, statistics and the full rating card for each player — tap a header to collapse it."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          options={[
            { value: "all", label: "Both teams", count: players.length },
            { value: "A", label: teamAName, count: players.filter((p) => p.teamId === "A").length },
            { value: "B", label: teamBName, count: players.filter((p) => p.teamId === "B").length },
          ]}
          value={team}
          onChange={setTeam}
        />
        <FilterChips
          options={SORTS.map((option) => ({ value: option.value, label: option.label }))}
          value={sort}
          onChange={(value) => setSort(value as SortKey)}
        />
      </div>

      <div className="grid items-start gap-2 lg:grid-cols-2">
        {visible.map((player) => (
          <PlayerCard key={player.id} player={player} defaultOpen />
        ))}
      </div>
    </SectionCard>
  );
}
