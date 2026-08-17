"use client";

import { ClipboardList, Info, Minus, Plus, Users } from "lucide-react";
import { SectionCard, JerseyBadge, TEAM_COLORS } from "./report-ui";
import { cn } from "@/lib/utils";
import type { DataQuality, MatchReport } from "@/types/sports-analysis";

interface MatchReportPanelProps {
  report: MatchReport;
  dataQuality: DataQuality;
  teamAName: string;
  teamBName: string;
}

function TraitList({
  title,
  items,
  positive,
}: {
  title: string;
  items: string[];
  positive: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-400">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
            {positive ? (
              <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            ) : (
              <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
            )}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MatchReportPanel({
  report,
  dataQuality,
  teamAName,
  teamBName,
}: MatchReportPanelProps) {
  return (
    <>
      <SectionCard
        title="Final match report"
        icon={<ClipboardList className="h-5 w-5 text-indigo-400" />}
        description={report.finalScore}
      >
        {report.tacticalSummary && (
          <p className="rounded-xl bg-black/20 p-4 text-sm text-gray-300">{report.tacticalSummary}</p>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className={cn("space-y-4 rounded-xl border bg-white/5 p-4", TEAM_COLORS.A.border)}>
            <p className={cn("font-medium", TEAM_COLORS.A.text)}>{teamAName}</p>
            <TraitList title="Strengths" items={report.teamAStrengths} positive />
            <TraitList title="Weaknesses" items={report.teamAWeaknesses} positive={false} />
          </div>
          <div className={cn("space-y-4 rounded-xl border bg-white/5 p-4", TEAM_COLORS.B.border)}>
            <p className={cn("font-medium", TEAM_COLORS.B.text)}>{teamBName}</p>
            <TraitList title="Strengths" items={report.teamBStrengths} positive />
            <TraitList title="Weaknesses" items={report.teamBWeaknesses} positive={false} />
          </div>
        </div>
      </SectionCard>

      {report.bestXI.length > 0 && (
        <SectionCard
          title="Best XI (estimated)"
          icon={<Users className="h-5 w-5 text-emerald-400" />}
          description="The strongest combined line-up from the players on screen."
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {report.bestXI.map((entry, index) => {
              const teamId = entry.team.toLowerCase() === teamAName.toLowerCase() ? "A" : "B";
              return (
                <div
                  key={`${entry.jerseyNumber}-${index}`}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <JerseyBadge number={entry.jerseyNumber} teamId={teamId} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{entry.position}</p>
                    <p className="truncate text-xs text-gray-500">{entry.team}</p>
                    {entry.reason && <p className="mt-1 text-xs text-gray-400">{entry.reason}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Data quality"
        icon={<Info className="h-5 w-5 text-gray-400" />}
        description="How much of this report is measured versus estimated."
      >
        <p className="text-sm text-gray-300">{dataQuality.coverage}</p>

        {dataQuality.estimatedFields.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-400">Estimated values</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {dataQuality.estimatedFields.map((field, index) => (
                <span
                  key={index}
                  className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-400"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        {dataQuality.caveats.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {dataQuality.caveats.map((caveat, index) => (
              <li key={index} className="text-xs text-amber-200/80">
                • {caveat}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </>
  );
}
