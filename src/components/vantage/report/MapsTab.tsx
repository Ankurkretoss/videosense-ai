"use client";

import { useMemo, useState } from "react";
import { Card, CardTitle, Legend, PitchFrame } from "./report-bits";
import { Chip } from "@/components/vantage/ui";
import type { SportsAnalysis, TeamId } from "@/types/sports-analysis";

const COLUMNS = 12;
const ROWS = 8;

/** Bins every heatmap zone of the chosen team into a 12x8 grid of intensities. */
function heatGrid(analysis: SportsAnalysis, team: "all" | TeamId): number[] {
  const cells = new Array(COLUMNS * ROWS).fill(0);

  analysis.players
    .filter((player) => team === "all" || player.teamId === team)
    .forEach((player) =>
      player.tracking.heatmapZones.forEach((zone) => {
        const column = Math.min(COLUMNS - 1, Math.floor((zone.x / 100) * COLUMNS));
        const row = Math.min(ROWS - 1, Math.floor((zone.y / 100) * ROWS));
        cells[row * COLUMNS + column] += zone.intensity;
      })
    );

  const peak = Math.max(...cells, 1);
  return cells.map((value) => value / peak);
}

export function MapsTab({ analysis }: { analysis: SportsAnalysis }) {
  const [team, setTeam] = useState<"all" | TeamId>("all");
  const isTeamA = (label: string) =>
    label.toLowerCase() === analysis.playerCount.teamA.name.toLowerCase();

  const grid = useMemo(() => heatGrid(analysis, team), [analysis, team]);

  const shots = analysis.shots.filter(
    (shot) => team === "all" || (team === "A") === isTeamA(shot.team)
  );
  const passes = analysis.passes.filter(
    (pass) => team === "all" || (team === "A") === isTeamA(pass.team)
  );
  const goals = shots.filter((shot) => shot.outcome === "goal").length;

  const teamOptions = [
    { value: "all" as const, label: "Both teams" },
    { value: "A" as const, label: analysis.playerCount.teamA.name },
    { value: "B" as const, label: analysis.playerCount.teamB.name },
  ];

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {teamOptions.map((option) => (
          <Chip key={option.value} active={team === option.value} onClick={() => setTeam(option.value)}>
            {option.label}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-4">
        <Card className="p-[18px]">
          <CardTitle>
            Team heatmap ·{" "}
            {team === "all"
              ? "both teams"
              : team === "A"
                ? analysis.playerCount.teamA.name
                : analysis.playerCount.teamB.name}
          </CardTitle>
          <div
            className="mt-3.5 grid aspect-[3/2] gap-0.5"
            style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)` }}
          >
            {grid.map((value, index) => (
              <div
                key={index}
                className="rounded-sm"
                style={{ background: `rgba(139,107,255,${(value * 0.85).toFixed(3)})` }}
              />
            ))}
          </div>
          <Legend
            items={[
              { color: "rgba(139,107,255,0.15)", label: "low presence", wide: true },
              { color: "rgba(139,107,255,0.85)", label: "high presence", wide: true },
            ]}
          />
        </Card>

        <Card className="p-[18px]">
          <CardTitle>
            Shot map · {shots.length} shots · {goals} goals
          </CardTitle>
          <PitchFrame className="mt-3.5">
            <div className="absolute inset-y-[18%] right-0 w-[26%] border border-white/[0.12]" />
            <div className="absolute inset-y-[34%] right-0 w-[11%] border border-white/[0.12]" />
            {shots.map((shot, index) => {
              const color =
                shot.outcome === "goal" ? "#34D399" : shot.onTarget ? "#A78BFA" : "#4A4A58";
              const size = 8 + shot.xG * 22;
              return (
                <div
                  key={index}
                  title={`${shot.timestamp} · ${shot.shotType} · ${shot.xG.toFixed(2)} xG`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50"
                  style={{
                    left: `${shot.location.x}%`,
                    top: `${shot.location.y}%`,
                    width: size,
                    height: size,
                    background: color,
                  }}
                />
              );
            })}
          </PitchFrame>
          <Legend
            items={[
              { color: "#34D399", label: "Goal" },
              { color: "#A78BFA", label: "On target" },
              { color: "#4A4A58", label: "Off target · size = xG" },
            ]}
          />
        </Card>

        {passes.length > 0 && (
          <Card className="p-[18px] [grid-column:1/-1]">
            <CardTitle>Pass map · {passes.length} passes</CardTitle>
            <PitchFrame className="mt-3.5">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                {passes.map((pass, index) => (
                  <g key={index} opacity={pass.successful ? 0.85 : 0.4}>
                    <line
                      x1={pass.start.x}
                      y1={pass.start.y}
                      x2={pass.end.x}
                      y2={pass.end.y}
                      stroke={
                        pass.successful ? (isTeamA(pass.team) ? "#8B6BFF" : "#F87171") : "#94a3b8"
                      }
                      strokeWidth={pass.progressive ? 0.7 : 0.4}
                      strokeDasharray={pass.successful ? undefined : "1.4 1"}
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={pass.end.x}
                      cy={pass.end.y}
                      r={0.8}
                      fill={isTeamA(pass.team) ? "#8B6BFF" : "#F87171"}
                    />
                  </g>
                ))}
              </svg>
            </PitchFrame>
            <Legend
              items={[
                { color: "#8B6BFF", label: `${analysis.playerCount.teamA.name} pass`, wide: true },
                { color: "#F87171", label: `${analysis.playerCount.teamB.name} pass`, wide: true },
                { color: "#94a3b8", label: "incomplete (dashed)", wide: true },
              ]}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
