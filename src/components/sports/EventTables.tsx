"use client";

import { useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";
import { SectionCard, DataTable, FilterChips, JerseyTag, type Column } from "./report-ui";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  DefensiveAction,
  DefensiveActionType,
  KickEvent,
  PassEvent,
  RefereeDecision,
  ShotEvent,
  SportsAnalysis,
  TouchEvent,
} from "@/types/sports-analysis";

interface EventTablesProps {
  analysis: SportsAnalysis;
}

type TabKey = "shots" | "passes" | "kicks" | "touches" | "defensive" | "referee";

function yesNo(value: boolean) {
  return (
    <span className={value ? "text-emerald-400" : "text-gray-500"}>{value ? "yes" : "no"}</span>
  );
}

function flags(pass: PassEvent): string {
  const active = [
    pass.progressive && "progressive",
    pass.throughBall && "through ball",
    pass.cross && "cross",
    pass.longBall && "long ball",
    pass.backPass && "back pass",
  ].filter(Boolean) as string[];
  return active.join(", ") || "—";
}

const DEFENSIVE_LABELS: Record<DefensiveActionType, string> = {
  tackle: "tackle",
  interception: "interception",
  block: "block",
  clearance: "clearance",
  pressure: "pressure",
  duel: "duel",
  error: "mistake",
};

const OUTCOME_TONE: Record<string, string> = {
  goal: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  saved: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  blocked: "border-sky-500/50 bg-sky-500/10 text-sky-300",
  post: "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300",
  deflected: "border-indigo-500/50 bg-indigo-500/10 text-indigo-300",
  "off-target": "border-white/15 bg-white/5 text-gray-400",
};

export function EventTables({ analysis }: EventTablesProps) {
  const [tab, setTab] = useState<TabKey>("shots");
  const [query, setQuery] = useState("");

  const tabs = [
    { value: "shots", label: "Shots", count: analysis.shots.length },
    { value: "passes", label: "Passes", count: analysis.passes.length },
    { value: "kicks", label: "Kicks", count: analysis.kicks.length },
    { value: "touches", label: "Touches", count: analysis.touches.length },
    { value: "defensive", label: "Defending", count: analysis.defensiveActions.length },
    { value: "referee", label: "Referee", count: analysis.refereeDecisions.length },
  ];

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/^#/, "");
    if (!needle) return null;
    return (values: (string | null | undefined)[]) =>
      values.some((value) => (value ?? "").toLowerCase().includes(needle));
  }, [query]);

  const shotColumns: Column<ShotEvent>[] = [
    { key: "time", header: "Time", render: (row) => <span className="text-indigo-400">{row.timestamp}</span> },
    { key: "player", header: "Player", render: (row) => <JerseyTag number={row.shooterJerseyNumber} /> },
    { key: "team", header: "Team", render: (row) => row.team },
    { key: "type", header: "Type", render: (row) => row.shotType || "—" },
    { key: "distance", header: "Distance", align: "right", render: (row) => `${row.distanceM} m` },
    { key: "speed", header: "Speed", align: "right", render: (row) => `${row.speedKmh} km/h` },
    { key: "angle", header: "Angle", align: "right", render: (row) => `${row.angleDeg}°` },
    { key: "xg", header: "xG", align: "right", render: (row) => row.xG.toFixed(2) },
    {
      key: "outcome",
      header: "Outcome",
      render: (row) => (
        <Badge variant="outline" className={cn("text-xs", OUTCOME_TONE[row.outcome])}>
          {row.outcome}
        </Badge>
      ),
    },
    { key: "target", header: "On target", align: "right", render: (row) => yesNo(row.onTarget) },
    {
      key: "assist",
      header: "Assist",
      render: (row) => (row.assistJerseyNumber ? <JerseyTag number={row.assistJerseyNumber} /> : "—"),
    },
    {
      key: "description",
      header: "What happened",
      className: "max-w-md whitespace-normal",
      render: (row) => <span className="text-gray-400">{row.description || "—"}</span>,
    },
  ];

  const passColumns: Column<PassEvent>[] = [
    { key: "time", header: "Time", render: (row) => <span className="text-indigo-400">{row.timestamp}</span> },
    {
      key: "players",
      header: "Passer → receiver",
      render: (row) => (
        <span className="whitespace-nowrap">
          <JerseyTag number={row.passerJerseyNumber} />
          {" → "}
          {row.receiverJerseyNumber ? <JerseyTag number={row.receiverJerseyNumber} /> : "lost"}
        </span>
      ),
    },
    { key: "team", header: "Team", render: (row) => row.team },
    { key: "distance", header: "Distance", align: "right", render: (row) => `${row.distanceM} m` },
    { key: "height", header: "Height", render: (row) => row.passHeight },
    { key: "speed", header: "Speed", align: "right", render: (row) => `${row.speedKmh} km/h` },
    { key: "angle", header: "Angle", align: "right", render: (row) => `${row.angleDeg}°` },
    { key: "direction", header: "Direction", render: (row) => row.direction || "—" },
    { key: "accuracy", header: "Accuracy", align: "right", render: (row) => `${row.accuracyScore}%` },
    { key: "success", header: "Complete", align: "right", render: (row) => yesNo(row.successful) },
    { key: "flags", header: "Flags", render: (row) => <span className="text-gray-400">{flags(row)}</span> },
  ];

  const kickColumns: Column<KickEvent>[] = [
    { key: "time", header: "Time", render: (row) => <span className="text-indigo-400">{row.timestamp}</span> },
    { key: "player", header: "Player", render: (row) => <JerseyTag number={row.jerseyNumber} /> },
    { key: "type", header: "Kick", render: (row) => row.kickType || "—" },
    { key: "foot", header: "Foot", render: (row) => row.foot },
    { key: "contact", header: "Contact point", render: (row) => row.contactPoint || "—" },
    { key: "speed", header: "Ball speed", align: "right", render: (row) => `${row.ballSpeedKmh} km/h` },
    { key: "launch", header: "Launch speed", align: "right", render: (row) => `${row.launchSpeedKmh} km/h` },
    { key: "launchAngle", header: "Launch angle", align: "right", render: (row) => `${row.launchAngleDeg}°` },
    { key: "ground", header: "Ground angle", align: "right", render: (row) => `${row.groundAngleDeg}°` },
    { key: "elevation", header: "Elevation", align: "right", render: (row) => `${row.elevationAngleDeg}°` },
    { key: "direction", header: "Direction", align: "right", render: (row) => `${row.directionDeg}°` },
    { key: "power", header: "Power", align: "right", render: (row) => `${row.powerPercent}%` },
    { key: "force", header: "Force", align: "right", render: (row) => `${row.estimatedForceN} N` },
    { key: "accuracy", header: "Accuracy", align: "right", render: (row) => `${row.accuracyScore}%` },
  ];

  const touchColumns: Column<TouchEvent>[] = [
    { key: "time", header: "Time", render: (row) => <span className="text-indigo-400">{row.timestamp}</span> },
    { key: "player", header: "Player", render: (row) => <JerseyTag number={row.jerseyNumber} /> },
    { key: "team", header: "Team", render: (row) => row.team },
    { key: "type", header: "Touch", render: (row) => row.touchType || "—" },
    { key: "quality", header: "First touch", render: (row) => row.firstTouchQuality || "—" },
    { key: "direction", header: "Direction", render: (row) => row.direction || "—" },
    { key: "pressure", header: "Pressure", render: (row) => row.pressure || "—" },
    { key: "distance", header: "Carried", align: "right", render: (row) => `${row.distanceAfterM} m` },
    {
      key: "notes",
      header: "What it achieved",
      className: "max-w-md whitespace-normal",
      render: (row) => <span className="text-gray-400">{row.notes || "—"}</span>,
    },
  ];

  const defensiveColumns: Column<DefensiveAction>[] = [
    { key: "time", header: "Time", render: (row) => <span className="text-indigo-400">{row.timestamp}</span> },
    { key: "player", header: "Player", render: (row) => <JerseyTag number={row.jerseyNumber} /> },
    { key: "team", header: "Team", render: (row) => row.team },
    { key: "type", header: "Action", render: (row) => DEFENSIVE_LABELS[row.actionType] },
    { key: "success", header: "Won", align: "right", render: (row) => yesNo(row.successful) },
    { key: "description", header: "Detail", render: (row) => <span className="text-gray-400">{row.description}</span> },
  ];

  const refereeColumns: Column<RefereeDecision>[] = [
    { key: "time", header: "Time", render: (row) => <span className="text-indigo-400">{row.timestamp}</span> },
    {
      key: "type",
      header: "Decision",
      render: (row) => (
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            row.type === "red-card"
              ? "border-red-500/50 bg-red-500/10 text-red-300"
              : row.type === "yellow-card"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                : "border-white/15 bg-white/5 text-gray-300"
          )}
        >
          {row.type}
        </Badge>
      ),
    },
    { key: "player", header: "Player", render: (row) => <JerseyTag number={row.jerseyNumber} /> },
    { key: "team", header: "Team", render: (row) => row.team },
    { key: "description", header: "Detail", render: (row) => <span className="text-gray-400">{row.description}</span> },
  ];

  const body = () => {
    switch (tab) {
      case "passes": {
        const rows = matches
          ? analysis.passes.filter((row) =>
              matches([row.passerJerseyNumber, row.receiverJerseyNumber, row.team, row.direction])
            )
          : analysis.passes;
        return <DataTable rows={rows} columns={passColumns} rowKey={(_, i) => `pass-${i}`} />;
      }
      case "kicks": {
        const rows = matches
          ? analysis.kicks.filter((row) => matches([row.jerseyNumber, row.team, row.kickType]))
          : analysis.kicks;
        return <DataTable rows={rows} columns={kickColumns} rowKey={(_, i) => `kick-${i}`} />;
      }
      case "touches": {
        const rows = matches
          ? analysis.touches.filter((row) => matches([row.jerseyNumber, row.team, row.touchType]))
          : analysis.touches;
        return <DataTable rows={rows} columns={touchColumns} rowKey={(_, i) => `touch-${i}`} />;
      }
      case "defensive": {
        const rows = matches
          ? analysis.defensiveActions.filter((row) =>
              matches([row.jerseyNumber, row.team, row.actionType, row.description])
            )
          : analysis.defensiveActions;
        return <DataTable rows={rows} columns={defensiveColumns} rowKey={(_, i) => `def-${i}`} />;
      }
      case "referee": {
        const rows = matches
          ? analysis.refereeDecisions.filter((row) =>
              matches([row.jerseyNumber, row.team, row.type, row.description])
            )
          : analysis.refereeDecisions;
        return <DataTable rows={rows} columns={refereeColumns} rowKey={(_, i) => `ref-${i}`} />;
      }
      default: {
        const rows = matches
          ? analysis.shots.filter((row) => matches([row.shooterJerseyNumber, row.team, row.shotType]))
          : analysis.shots;
        return <DataTable rows={rows} columns={shotColumns} rowKey={(_, i) => `shot-${i}`} />;
      }
    }
  };

  return (
    <SectionCard
      title="Event log"
      icon={<Activity className="h-5 w-5 text-indigo-400" />}
      description="Every detected action with its measured and estimated values."
      action={
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by #number or team"
            className="h-8 w-56 border-white/10 bg-white/5 pl-8 text-sm text-white placeholder:text-gray-500"
          />
        </div>
      }
    >
      <div className="mb-4">
        <FilterChips options={tabs} value={tab} onChange={(value) => setTab(value as TabKey)} />
      </div>
      {body()}
    </SectionCard>
  );
}
