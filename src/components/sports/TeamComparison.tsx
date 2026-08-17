"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { SectionCard, TEAM_COLORS } from "./report-ui";
import { cn } from "@/lib/utils";
import type { MatchReport, TeamStats } from "@/types/sports-analysis";

interface TeamComparisonProps {
  teamStats: TeamStats[];
  report: MatchReport;
}

interface MetricRow {
  label: string;
  a: number;
  b: number;
  suffix?: string;
  decimals?: number;
}

function ComparisonRow({ metric }: { metric: MetricRow }) {
  const total = metric.a + metric.b;
  const aShare = total > 0 ? (metric.a / total) * 100 : 50;
  const decimals = metric.decimals ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className={cn("font-medium tabular-nums", TEAM_COLORS.A.text)}>
          {metric.a.toFixed(decimals)}
          {metric.suffix}
        </span>
        <span className="text-xs text-gray-400">{metric.label}</span>
        <span className={cn("font-medium tabular-nums", TEAM_COLORS.B.text)}>
          {metric.b.toFixed(decimals)}
          {metric.suffix}
        </span>
      </div>
      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full", TEAM_COLORS.A.bg)} style={{ width: `${aShare}%` }} />
        <div className={cn("h-full", TEAM_COLORS.B.bg)} style={{ width: `${100 - aShare}%` }} />
      </div>
    </div>
  );
}

export function TeamComparison({ teamStats, report }: TeamComparisonProps) {
  const teamA = teamStats.find((team) => team.teamId === "A");
  const teamB = teamStats.find((team) => team.teamId === "B");
  if (!teamA || !teamB) return null;

  const metrics: MetricRow[] = [
    { label: "Possession", a: teamA.possessionPercent, b: teamB.possessionPercent, suffix: "%" },
    { label: "Shots", a: teamA.shots, b: teamB.shots },
    { label: "Shots on target", a: teamA.shotsOnTarget, b: teamB.shotsOnTarget },
    { label: "Big chances", a: teamA.bigChances, b: teamB.bigChances },
    { label: "Expected goals (xG)", a: teamA.xG, b: teamB.xG, decimals: 2 },
    { label: "Pass accuracy", a: teamA.passAccuracy, b: teamB.passAccuracy, suffix: "%" },
    { label: "Passes completed", a: teamA.passesCompleted, b: teamB.passesCompleted },
    { label: "Crosses", a: teamA.crosses, b: teamB.crosses },
    { label: "Through balls", a: teamA.throughBalls, b: teamB.throughBalls },
    { label: "Tackles", a: teamA.tackles, b: teamB.tackles },
    { label: "Interceptions", a: teamA.interceptions, b: teamB.interceptions },
    { label: "Clearances", a: teamA.clearances, b: teamB.clearances },
    { label: "Duels won", a: teamA.duelsWon, b: teamB.duelsWon },
    { label: "Saves", a: teamA.saves, b: teamB.saves },
    { label: "Fouls", a: teamA.fouls, b: teamB.fouls },
    { label: "Corners", a: teamA.corners, b: teamB.corners },
    { label: "Offsides", a: teamA.offsides, b: teamB.offsides },
    { label: "Yellow cards", a: teamA.yellowCards, b: teamB.yellowCards },
    { label: "Red cards", a: teamA.redCards, b: teamB.redCards },
    { label: "Distance covered", a: teamA.distanceCoveredKm, b: teamB.distanceCoveredKm, suffix: " km", decimals: 1 },
    { label: "Sprints", a: teamA.sprints, b: teamB.sprints },
  ];

  return (
    <SectionCard
      title="Scoreline & team statistics"
      icon={<BarChart3 className="h-5 w-5 text-indigo-400" />}
      description="Every number is estimated from the footage."
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6 grid grid-cols-3 items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-5"
      >
        <div className="text-center">
          <p className={cn("truncate text-sm font-medium", TEAM_COLORS.A.text)}>{teamA.teamName}</p>
          <p className="mt-1 text-xs text-gray-500">{teamA.shots} shots</p>
        </div>
        <p className="text-center text-4xl font-bold tabular-nums text-white">
          {report.teamAGoals} <span className="text-gray-600">–</span> {report.teamBGoals}
        </p>
        <div className="text-center">
          <p className={cn("truncate text-sm font-medium", TEAM_COLORS.B.text)}>{teamB.teamName}</p>
          <p className="mt-1 text-xs text-gray-500">{teamB.shots} shots</p>
        </div>
      </motion.div>

      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2 2xl:grid-cols-3">
        {metrics.map((metric) => (
          <ComparisonRow key={metric.label} metric={metric} />
        ))}
      </div>
    </SectionCard>
  );
}
