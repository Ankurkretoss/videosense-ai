"use client";

import { Hand, Target } from "lucide-react";
import { SectionCard, StatTile, RatingBar, TEAM_COLORS, jerseyDisplay } from "./report-ui";
import { cn } from "@/lib/utils";
import type { GoalkeeperAnalysis, TeamTactics } from "@/types/sports-analysis";

interface TacticsPanelProps {
  tactics: TeamTactics[];
  goalkeepers: GoalkeeperAnalysis[];
  teamAName: string;
}

const FIELDS: { key: keyof TeamTactics; label: string }[] = [
  { key: "shape", label: "Shape" },
  { key: "defensiveLine", label: "Defensive line" },
  { key: "pressingHeight", label: "Pressing height" },
  { key: "compactness", label: "Compactness" },
  { key: "buildUpPattern", label: "Build-up" },
  { key: "counterAttack", label: "Counter attack" },
  { key: "wingPlay", label: "Wing play" },
  { key: "centralAttack", label: "Central attack" },
  { key: "transitionSpeed", label: "Transition speed" },
];

export function TacticsPanel({ tactics, goalkeepers, teamAName }: TacticsPanelProps) {
  return (
    <>
      <SectionCard
        title="Tactical analysis"
        icon={<Target className="h-5 w-5 text-indigo-400" />}
        description="Formation, shape and playing patterns for each side."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {tactics.map((tactic) => {
            const colors = TEAM_COLORS[tactic.teamId];
            return (
              <div
                key={tactic.teamId}
                className={cn("rounded-xl border bg-white/5 p-4", colors.border)}
              >
                <div className="flex items-center justify-between">
                  <p className={cn("font-medium", colors.text)}>{tactic.teamName}</p>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-sm font-semibold text-white">
                    {tactic.formation || "—"}
                  </span>
                </div>

                {tactic.teamWidthM > 0 && (
                  <p className="mt-1 text-xs text-gray-500">Average team width ≈ {tactic.teamWidthM} m</p>
                )}

                <dl className="mt-3 space-y-2">
                  {FIELDS.map((field) => {
                    const value = tactic[field.key];
                    if (!value || typeof value !== "string") return null;
                    return (
                      <div key={field.key} className="rounded-lg bg-black/20 p-2.5">
                        <dt className="text-xs text-gray-500">{field.label}</dt>
                        <dd className="mt-0.5 text-sm text-gray-200">{value}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {goalkeepers.length > 0 && (
        <SectionCard
          title="Goalkeeper analysis"
          icon={<Hand className="h-5 w-5 text-amber-400" />}
          description="Shot stopping, distribution and positioning."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {goalkeepers.map((keeper, index) => {
              const teamId = keeper.team.toLowerCase() === teamAName.toLowerCase() ? "A" : "B";
              return (
                <div
                  key={`${keeper.jerseyNumber}-${index}`}
                  className={cn("rounded-xl border bg-white/5 p-4", TEAM_COLORS[teamId].border)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">
                      {jerseyDisplay(keeper.jerseyNumber).label}{" "}
                      <span className={cn("text-sm font-normal", TEAM_COLORS[teamId].text)}>
                        {keeper.team}
                      </span>
                    </p>
                    <span className="text-xs text-gray-500">{keeper.saveDifficulty}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatTile label="Saves" value={keeper.saves} accent="text-emerald-400" />
                    <StatTile label="Conceded" value={keeper.goalsConceded} accent="text-rose-400" />
                    <StatTile label="Punches" value={keeper.punches} />
                    <StatTile label="Reflex" value={`${keeper.reflexTimeSec}s`} />
                  </div>

                  <div className="mt-3 space-y-2">
                    <RatingBar
                      label="Distribution accuracy"
                      value={keeper.distributionAccuracy}
                      max={100}
                      suffix="%"
                    />
                    <RatingBar label="Catch success" value={keeper.catchSuccess} max={100} suffix="%" />
                  </div>

                  {keeper.positioning && (
                    <p className="mt-3 text-sm text-gray-300">{keeper.positioning}</p>
                  )}
                  {keeper.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-amber-300">Mistakes</p>
                      <ul className="mt-1 space-y-1">
                        {keeper.errors.map((mistake, mistakeIndex) => (
                          <li key={mistakeIndex} className="text-xs text-amber-200/80">
                            • {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {keeper.notes && <p className="mt-2 text-xs text-gray-500">{keeper.notes}</p>}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </>
  );
}
