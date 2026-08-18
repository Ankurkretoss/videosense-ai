"use client";

import { useMemo, useState } from "react";
import { Card, EVENT_COLORS } from "./report-bits";
import { Chip } from "@/components/vantage/ui";
import { timeToSeconds } from "@/lib/time";
import type { SportsAnalysis } from "@/types/sports-analysis";

interface EventRow {
  t: string;
  seconds: number;
  color: string;
  type: string;
  detail: string;
  group: "Goals" | "Shots" | "Passes" | "Kicks" | "Touches" | "Defending" | "Referee" | "Other";
}

function jersey(value: string | null | undefined): string {
  if (!value || /^unknown$/i.test(value)) return "#?";
  return /^\d{1,3}$/.test(value) ? `#${value}` : "#?";
}

function buildRows(analysis: SportsAnalysis): EventRow[] {
  const rows: EventRow[] = [];

  analysis.goals.forEach((goal) =>
    rows.push({
      t: goal.timestamp,
      seconds: timeToSeconds(goal.timestamp),
      color: EVENT_COLORS.goal,
      type: "Goal",
      detail: `${goal.scorerTeam} · ${jersey(goal.scorerJerseyNumber)} · ${goal.kickType}${
        goal.assistJerseyNumber ? ` · assist ${jersey(goal.assistJerseyNumber)}` : ""
      }`,
      group: "Goals",
    })
  );

  analysis.shots.forEach((shot) =>
    rows.push({
      t: shot.timestamp,
      seconds: timeToSeconds(shot.timestamp),
      color: shot.outcome === "goal" ? EVENT_COLORS.goal : shot.onTarget ? EVENT_COLORS.shot : "#4A4A58",
      type: shot.outcome === "goal" ? "Goal · shot" : shot.onTarget ? "Shot on target" : "Shot off target",
      detail: `${shot.team} · ${jersey(shot.shooterJerseyNumber)} · ${shot.distanceM} m · ${shot.xG.toFixed(2)} xG${
        shot.description ? ` · ${shot.description}` : ""
      }`,
      group: "Shots",
    })
  );

  analysis.passes.forEach((pass) =>
    rows.push({
      t: pass.timestamp,
      seconds: timeToSeconds(pass.timestamp),
      color: pass.successful ? EVENT_COLORS.defensive : "#4A4A58",
      type: pass.cross ? "Cross" : pass.throughBall ? "Through ball" : pass.longBall ? "Long ball" : "Pass",
      detail: `${pass.team} · ${jersey(pass.passerJerseyNumber)} → ${
        pass.receiverJerseyNumber ? jersey(pass.receiverJerseyNumber) : "lost"
      } · ${pass.distanceM} m · ${pass.speedKmh} km/h`,
      group: "Passes",
    })
  );

  analysis.kicks.forEach((kick) =>
    rows.push({
      t: kick.timestamp,
      seconds: timeToSeconds(kick.timestamp),
      color: EVENT_COLORS.shot,
      type: `Kick · ${kick.kickType || "strike"}`,
      detail: `${jersey(kick.jerseyNumber)} · ${kick.foot} foot · ${kick.ballSpeedKmh} km/h · ${kick.launchAngleDeg}° launch · ${kick.powerPercent}% power`,
      group: "Kicks",
    })
  );

  analysis.touches.forEach((touch) =>
    rows.push({
      t: touch.timestamp,
      seconds: timeToSeconds(touch.timestamp),
      color: EVENT_COLORS.other,
      type: `Touch · ${touch.touchType || "control"}`,
      detail: `${jersey(touch.jerseyNumber)} · ${touch.firstTouchQuality} · ${touch.pressure} pressure${
        touch.notes ? ` · ${touch.notes}` : ""
      }`,
      group: "Touches",
    })
  );

  analysis.defensiveActions.forEach((action) =>
    rows.push({
      t: action.timestamp,
      seconds: timeToSeconds(action.timestamp),
      color: action.actionType === "error" ? EVENT_COLORS.card : EVENT_COLORS.defensive,
      type: action.actionType === "error" ? "Defensive mistake" : action.actionType.charAt(0).toUpperCase() + action.actionType.slice(1),
      detail: `${action.team} · ${jersey(action.jerseyNumber)} · ${action.successful ? "won" : "lost"}${
        action.description ? ` · ${action.description}` : ""
      }`,
      group: "Defending",
    })
  );

  analysis.refereeDecisions.forEach((decision) =>
    rows.push({
      t: decision.timestamp,
      seconds: timeToSeconds(decision.timestamp),
      color: decision.type.includes("card") ? EVENT_COLORS.card : EVENT_COLORS.tactical,
      type: decision.type.replace("-", " ").replace(/^\w/, (c) => c.toUpperCase()),
      detail: `${decision.team} · ${jersey(decision.jerseyNumber)}${
        decision.description ? ` · ${decision.description}` : ""
      }`,
      group: "Referee",
    })
  );

  return rows.sort((a, b) => a.seconds - b.seconds);
}

export function EventsTab({
  analysis,
  onSeek,
}: {
  analysis: SportsAnalysis;
  onSeek?: (seconds: number) => void;
}) {
  const rows = useMemo(() => buildRows(analysis), [analysis]);
  const [filter, setFilter] = useState("All");

  const groups = ["All", "Goals", "Shots", "Passes", "Kicks", "Touches", "Defending", "Referee"];
  const counts = groups.map((group) => ({
    label: group,
    count: group === "All" ? rows.length : rows.filter((row) => row.group === group).length,
  }));

  const visible = filter === "All" ? rows : rows.filter((row) => row.group === filter);

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {counts
          .filter((group) => group.count > 0)
          .map((group) => (
            <Chip key={group.label} active={filter === group.label} onClick={() => setFilter(group.label)}>
              {group.label}
              <span className="font-mono-num ml-1.5 text-mute-3">{group.count}</span>
            </Chip>
          ))}
      </div>

      <Card className="px-4 pt-2 pb-3.5">
        {visible.length === 0 && (
          <p className="py-8 text-center text-[13px] text-mute-3">No events in this group.</p>
        )}
        {visible.map((row, index) => (
          <div
            key={`${row.t}-${index}`}
            className="grid grid-cols-[56px_12px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-white/[0.055] px-1 py-3.5 last:border-0 hover:bg-white/[0.025]"
          >
            <span className="font-mono-num text-[13px] text-mute">{row.t}</span>
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: row.color }}
            />
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-ink-200">{row.type}</div>
              <div className="mt-0.5 text-[12px] text-mute-2">{row.detail}</div>
            </div>
            <div className="flex items-center gap-2">
              {/* <button
                type="button"
                disabled={!onSeek}
                onClick={() => onSeek?.(row.seconds)}
                className="rounded-[7px] border border-brand/30 px-2.5 py-1.5 text-[11.5px] font-semibold text-brand-soft transition-colors hover:bg-brand/10 disabled:border-white/10 disabled:text-mute-3"
              >
                Play clip
              </button> */}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
