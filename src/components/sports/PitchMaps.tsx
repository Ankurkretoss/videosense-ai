"use client";

import { useMemo, useState } from "react";
import { Map } from "lucide-react";
import { SectionCard, FilterChips, TEAM_COLORS, jerseyDisplay } from "./report-ui";
import type { SportsAnalysis, TeamId } from "@/types/sports-analysis";

interface PitchMapsProps {
  analysis: SportsAnalysis;
}

type MapMode = "heatmap" | "passes" | "shots" | "movement";

const WIDTH = 100;
const HEIGHT = 64;

function scaleY(y: number): number {
  return (y / 100) * HEIGHT;
}

function Pitch({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox={`-2 -2 ${WIDTH + 4} ${HEIGHT + 4}`}
      className="w-full rounded-xl border border-white/10 bg-emerald-950/40"
      role="img"
    >
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#052e1a" stroke="#ffffff30" strokeWidth={0.4} />
      <line x1={WIDTH / 2} y1={0} x2={WIDTH / 2} y2={HEIGHT} stroke="#ffffff30" strokeWidth={0.3} />
      <circle cx={WIDTH / 2} cy={HEIGHT / 2} r={9} fill="none" stroke="#ffffff30" strokeWidth={0.3} />
      <circle cx={WIDTH / 2} cy={HEIGHT / 2} r={0.7} fill="#ffffff40" />
      <rect x={0} y={HEIGHT / 2 - 13} width={16} height={26} fill="none" stroke="#ffffff30" strokeWidth={0.3} />
      <rect x={WIDTH - 16} y={HEIGHT / 2 - 13} width={16} height={26} fill="none" stroke="#ffffff30" strokeWidth={0.3} />
      <rect x={0} y={HEIGHT / 2 - 6} width={6} height={12} fill="none" stroke="#ffffff30" strokeWidth={0.3} />
      <rect x={WIDTH - 6} y={HEIGHT / 2 - 6} width={6} height={12} fill="none" stroke="#ffffff30" strokeWidth={0.3} />
      {children}
    </svg>
  );
}

export function PitchMaps({ analysis }: PitchMapsProps) {
  const [mode, setMode] = useState<MapMode>("heatmap");
  const [team, setTeam] = useState<"all" | TeamId>("all");
  const [playerId, setPlayerId] = useState("all");

  const teamAName = analysis.playerCount.teamA.name;
  const isTeamA = (label: string) => label.toLowerCase() === teamAName.toLowerCase();

  const players = useMemo(
    () => analysis.players.filter((player) => team === "all" || player.teamId === team),
    [analysis.players, team]
  );

  const selectedPlayers = useMemo(
    () => (playerId === "all" ? players : players.filter((player) => player.id === playerId)),
    [players, playerId]
  );

  const hasHeatmap = analysis.players.some((player) => player.tracking.heatmapZones.length > 0);
  const hasPasses = analysis.passes.length > 0;
  const hasShots = analysis.shots.length > 0;
  const hasMovement = analysis.players.some((player) => player.tracking.movementPath.length > 1);

  if (!hasHeatmap && !hasPasses && !hasShots && !hasMovement) return null;

  const modes = [
    hasHeatmap && { value: "heatmap", label: "Heatmap" },
    hasPasses && { value: "passes", label: "Pass map", count: analysis.passes.length },
    hasShots && { value: "shots", label: "Shot map", count: analysis.shots.length },
    hasMovement && { value: "movement", label: "Movement" },
  ].filter(Boolean) as { value: string; label: string; count?: number }[];

  const renderHeatmap = () => (
    <>
      <defs>
        {(["A", "B"] as TeamId[]).map((id) => (
          <radialGradient key={id} id={`heat-${id}`}>
            <stop offset="0%" stopColor={TEAM_COLORS[id].hex} stopOpacity={0.75} />
            <stop offset="100%" stopColor={TEAM_COLORS[id].hex} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      {selectedPlayers.flatMap((player) =>
        player.tracking.heatmapZones.map((zone, index) => (
          <circle
            key={`${player.id}-${index}`}
            cx={zone.x}
            cy={scaleY(zone.y)}
            r={4 + (zone.intensity / 100) * 7}
            fill={`url(#heat-${player.teamId})`}
            opacity={0.25 + (zone.intensity / 100) * 0.55}
          />
        ))
      )}
    </>
  );

  const renderPasses = () => {
    const jerseys = new Set(selectedPlayers.map((player) => player.jerseyNumber));
    const passes = analysis.passes.filter((pass) => {
      const teamMatch = team === "all" || (team === "A") === isTeamA(pass.team);
      const playerMatch = playerId === "all" || jerseys.has(pass.passerJerseyNumber);
      return teamMatch && playerMatch;
    });

    return (
      <>
        {passes.map((pass, index) => {
          const id: TeamId = isTeamA(pass.team) ? "A" : "B";
          return (
            <g key={index} opacity={pass.successful ? 0.85 : 0.45}>
              <line
                x1={pass.start.x}
                y1={scaleY(pass.start.y)}
                x2={pass.end.x}
                y2={scaleY(pass.end.y)}
                stroke={pass.successful ? TEAM_COLORS[id].hex : "#94a3b8"}
                strokeWidth={pass.progressive ? 0.7 : 0.4}
                strokeDasharray={pass.successful ? undefined : "1.2 1"}
              />
              <circle cx={pass.end.x} cy={scaleY(pass.end.y)} r={0.7} fill={TEAM_COLORS[id].hex} />
            </g>
          );
        })}
      </>
    );
  };

  const renderShots = () => {
    const jerseys = new Set(selectedPlayers.map((player) => player.jerseyNumber));
    const shots = analysis.shots.filter((shot) => {
      const teamMatch = team === "all" || (team === "A") === isTeamA(shot.team);
      const playerMatch = playerId === "all" || jerseys.has(shot.shooterJerseyNumber);
      return teamMatch && playerMatch;
    });

    return (
      <>
        {shots.map((shot, index) => {
          const fill =
            shot.outcome === "goal" ? "#34d399" : shot.onTarget ? "#fbbf24" : "#94a3b8";
          return (
            <g key={index}>
              <circle
                cx={shot.location.x}
                cy={scaleY(shot.location.y)}
                r={1.4 + shot.xG * 4}
                fill={fill}
                fillOpacity={0.35}
                stroke={fill}
                strokeWidth={0.35}
              />
              <text
                x={shot.location.x}
                y={scaleY(shot.location.y) - 2.6 - shot.xG * 4}
                textAnchor="middle"
                fontSize={2.2}
                fill="#e2e8f0"
              >
                {jerseyDisplay(shot.shooterJerseyNumber).badge}
              </text>
            </g>
          );
        })}
      </>
    );
  };

  const renderMovement = () => (
    <>
      {selectedPlayers.map((player) => {
        if (player.tracking.movementPath.length < 2) return null;
        const path = player.tracking.movementPath
          .map((step, index) => `${index === 0 ? "M" : "L"} ${step.x} ${scaleY(step.y)}`)
          .join(" ");
        return (
          <g key={player.id}>
            <path d={path} fill="none" stroke={TEAM_COLORS[player.teamId].hex} strokeWidth={0.4} opacity={0.7} />
            <circle
              cx={player.tracking.movementPath[0].x}
              cy={scaleY(player.tracking.movementPath[0].y)}
              r={0.9}
              fill={TEAM_COLORS[player.teamId].hex}
            />
          </g>
        );
      })}
    </>
  );

  return (
    <SectionCard
      title="Pitch maps"
      icon={<Map className="h-5 w-5 text-indigo-400" />}
      description="Positions are AI-estimated and projected onto a normalised pitch."
    >
      <div className="mb-4 space-y-3">
        <FilterChips options={modes} value={mode} onChange={(value) => setMode(value as MapMode)} />
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips
            options={[
              { value: "all", label: "Both teams" },
              { value: "A", label: analysis.playerCount.teamA.name },
              { value: "B", label: analysis.playerCount.teamB.name },
            ]}
            value={team}
            onChange={(value) => {
              setTeam(value as "all" | TeamId);
              setPlayerId("all");
            }}
          />
          <select
            value={playerId}
            onChange={(event) => setPlayerId(event.target.value)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300 outline-none focus:border-indigo-500/50"
          >
            <option value="all">All players</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {jerseyDisplay(player.jerseyNumber).short} · {player.position || player.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Pitch>
        {mode === "heatmap" && renderHeatmap()}
        {mode === "passes" && renderPasses()}
        {mode === "shots" && renderShots()}
        {mode === "movement" && renderMovement()}
      </Pitch>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: TEAM_COLORS.A.hex }} />
          {analysis.playerCount.teamA.name}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: TEAM_COLORS.B.hex }} />
          {analysis.playerCount.teamB.name}
        </span>
        {mode === "shots" && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> goal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> on target
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" /> off target · marker size = xG
            </span>
          </>
        )}
        {mode === "passes" && <span>Dashed lines are incomplete passes; thicker lines are progressive.</span>}
      </div>
    </SectionCard>
  );
}
