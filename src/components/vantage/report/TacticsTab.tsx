"use client";

import { Card, CardTitle, Legend, PitchFrame, SectionEyebrow } from "./report-bits";
import type { SportsAnalysis, SportsPlayer, TeamId } from "@/types/sports-analysis";

const NARRATIVE_CARDS: { key: keyof SportsAnalysis["narratives"]; tag: string; color: string }[] = [
  { key: "attacking", tag: "Attacking pattern", color: "#34D399" },
  { key: "defending", tag: "Defending", color: "#F87171" },
  { key: "passing", tag: "Passing & circulation", color: "#C3B2FF" },
  { key: "physical", tag: "Physical output", color: "#60A5FA" },
  { key: "goalkeeping", tag: "Goalkeeping", color: "#FBBF24" },
  { key: "setPieces", tag: "Set pieces", color: "#60A5FA" },
  { key: "refereeing", tag: "Refereeing", color: "#8A8A98" },
  { key: "momentum", tag: "Momentum", color: "#C3B2FF" },
];

const REPORT_SECTIONS = [
  "Match overview",
  "Key moments",
  "Team performance",
  "Player performance",
  "Tactical analysis",
  "Strengths",
  "Weaknesses",
  "Defensive analysis",
  "Attacking analysis",
  "Recommendations",
];

/** Average pitch position for a player, from their heatmap or movement path. */
function averagePosition(player: SportsPlayer): { x: number; y: number } | null {
  const points = player.tracking.heatmapZones.length
    ? player.tracking.heatmapZones
    : player.tracking.movementPath;
  if (points.length === 0) return null;

  const total = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), {
    x: 0,
    y: 0,
  });
  return { x: total.x / points.length, y: total.y / points.length };
}

function jerseyGlyph(value: string): string {
  if (/^\d{1,3}$/.test(value)) return value;
  const counter = value.match(/(\d{1,2})\s*$/);
  return counter ? `?${counter[1]}` : "?";
}

export function TacticsTab({ analysis }: { analysis: SportsAnalysis }) {
  const teamA = analysis.tactics.find((tactic) => tactic.teamId === "A");
  const written = NARRATIVE_CARDS.filter((card) => analysis.narratives[card.key]);

  const positioned = (["A", "B"] as TeamId[]).flatMap((teamId) =>
    analysis.players
      .filter((player) => player.teamId === teamId)
      .map((player) => ({ player, at: averagePosition(player) }))
      .filter((entry): entry is { player: SportsPlayer; at: { x: number; y: number } } => entry.at !== null)
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Card className="p-[18px]">
          <CardTitle>
            {teamA?.teamName ?? analysis.playerCount.teamA.name} {teamA?.formation ?? ""} · average
            positions, pressing zones
          </CardTitle>
          <PitchFrame className="mt-3.5">
            <div className="absolute inset-x-[40%] top-0 bottom-[55%] bg-gradient-to-b from-brand/[0.28] to-transparent" />
            {positioned.map(({ player, at }) => (
              <div
                key={player.id}
                title={`${player.position || player.role} · ${player.team}`}
                className="font-mono-num absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 text-[11px] font-semibold text-white"
                style={{
                  left: `${at.x}%`,
                  top: `${at.y}%`,
                  background:
                    player.teamId === "A" ? "rgba(107,73,255,0.92)" : "rgba(248,113,113,0.92)",
                }}
              >
                {jerseyGlyph(player.jerseyNumber)}
              </div>
            ))}
          </PitchFrame>
          <Legend
            items={[
              { color: "rgba(107,73,255,0.9)", label: `${analysis.playerCount.teamA.name} average position` },
              { color: "rgba(248,113,113,0.9)", label: `${analysis.playerCount.teamB.name} average position` },
              { color: "rgba(139,107,255,0.3)", label: "Pressing zone", wide: true },
            ]}
          />
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {analysis.tactics.map((tactic) => (
            <Card key={tactic.teamId} className="p-[18px]">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{tactic.teamName}</CardTitle>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[13px] font-semibold text-white">
                  {tactic.formation || "—"}
                </span>
              </div>
              <dl className="mt-3 flex flex-col gap-2">
                {(
                  [
                    ["Shape", tactic.shape],
                    ["Defensive line", tactic.defensiveLine],
                    ["Pressing height", tactic.pressingHeight],
                    ["Compactness", tactic.compactness],
                    ["Build-up", tactic.buildUpPattern],
                    ["Counter attack", tactic.counterAttack],
                    ["Wing play", tactic.wingPlay],
                    ["Central attack", tactic.centralAttack],
                    ["Transition speed", tactic.transitionSpeed],
                  ] as [string, string][]
                )
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label} className="rounded-[10px] bg-white/[0.03] p-2.5">
                      <dt className="text-[11px] tracking-[0.06em] text-mute-3 uppercase">{label}</dt>
                      <dd className="mt-1 text-[12.5px] leading-[1.5] text-ink-400">{value}</dd>
                    </div>
                  ))}
              </dl>
            </Card>
          ))}
        </div>

        {analysis.goalkeepers.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {analysis.goalkeepers.map((keeper, index) => (
              <Card key={`${keeper.jerseyNumber}-${index}`} className="p-[18px]">
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Goalkeeper {jerseyGlyph(keeper.jerseyNumber)} · {keeper.team}
                  </CardTitle>
                  <span className="font-mono-num text-[12px] text-good">{keeper.saves} saves</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[
                    { k: "Saves", v: keeper.saves },
                    { k: "Conceded", v: keeper.goalsConceded },
                    { k: "Punches", v: keeper.punches },
                    { k: "Reflex", v: `${keeper.reflexTimeSec}s` },
                  ].map((stat) => (
                    <div key={stat.k} className="rounded-[9px] bg-white/[0.03] p-2.5">
                      <div className="font-mono-num text-[14px] text-ink-200">{stat.v}</div>
                      <div className="mt-0.5 text-[10.5px] text-mute-3">{stat.k}</div>
                    </div>
                  ))}
                </div>
                {keeper.positioning && (
                  <p className="mt-3 text-[12.5px] leading-[1.55] text-mute">{keeper.positioning}</p>
                )}
                {keeper.errors.length > 0 && (
                  <div className="mt-2.5">
                    <SectionEyebrow color="#FBBF24">Mistakes</SectionEyebrow>
                    <ul className="mt-1.5 space-y-1">
                      {keeper.errors.map((mistake, errorIndex) => (
                        <li key={errorIndex} className="text-[12px] text-warn/90">
                          • {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {written.map((card) => (
          <Card key={card.key} className="p-4">
            <SectionEyebrow color={card.color}>{card.tag}</SectionEyebrow>
            <p className="mt-2.5 text-[13.5px] leading-[1.55] text-ink-300">
              {analysis.narratives[card.key]}
            </p>
          </Card>
        ))}

        {analysis.turningPoints.length > 0 && (
          <Card className="p-4">
            <SectionEyebrow color="#FBBF24">Turning points</SectionEyebrow>
            <div className="mt-3 flex flex-col gap-2.5">
              {analysis.turningPoints.map((point, index) => (
                <div key={index} className="rounded-[10px] bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-num text-[11.5px] text-warn">{point.timestamp}</span>
                    <span className="text-[13px] font-semibold text-ink-200">{point.title}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-[1.5] text-mute">{point.description}</p>
                  {point.impact && (
                    <p className="mt-1.5 text-[11.5px] text-warn/85">Impact: {point.impact}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {analysis.keyBattles.length > 0 && (
          <Card className="p-4">
            <SectionEyebrow color="#C3B2FF">Key battles</SectionEyebrow>
            <div className="mt-3 flex flex-col gap-2.5">
              {analysis.keyBattles.map((battle, index) => (
                <div key={index} className="rounded-[10px] bg-white/[0.03] p-3">
                  <div className="text-[13px] font-semibold text-ink-200">{battle.matchup}</div>
                  <p className="mt-1.5 text-[12.5px] leading-[1.5] text-mute">{battle.description}</p>
                  {battle.winner && (
                    <p className="mt-1.5 text-[11.5px] text-good">Edge: {battle.winner}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <SectionEyebrow>Strengths &amp; weaknesses</SectionEyebrow>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              { name: analysis.playerCount.teamA.name, s: analysis.report.teamAStrengths, w: analysis.report.teamAWeaknesses },
              { name: analysis.playerCount.teamB.name, s: analysis.report.teamBStrengths, w: analysis.report.teamBWeaknesses },
            ].map((team) => (
              <div key={team.name} className="rounded-[10px] bg-white/[0.03] p-3">
                <div className="text-[12.5px] font-bold text-ink-200">{team.name}</div>
                <ul className="mt-2 space-y-1">
                  {team.s.map((item, index) => (
                    <li key={`s${index}`} className="text-[12px] text-good">
                      + {item}
                    </li>
                  ))}
                  {team.w.map((item, index) => (
                    <li key={`w${index}`} className="text-[12px] text-bad">
                      − {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        {analysis.improvements.length > 0 && (
          <Card className="p-4">
            <SectionEyebrow color="#C3B2FF">Coaching improvements</SectionEyebrow>
            <div className="mt-3 flex flex-col gap-2.5">
              {analysis.improvements.map((item, index) => (
                <div key={index} className="rounded-[10px] bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-num text-[11px] text-brand">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[12px] font-semibold text-brand-soft">{item.area}</span>
                    {item.timestamp && (
                      <span className="font-mono-num text-[11px] text-mute-3">{item.timestamp}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-[1.5] text-ink-400">{item.issue}</p>
                  {item.recommendation && (
                    <p className="mt-1.5 text-[12px] leading-[1.5] text-good">{item.recommendation}</p>
                  )}
                  {item.drill && (
                    <p className="mt-1.5 text-[11.5px] leading-[1.5] text-mute-3">Drill: {item.drill}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {analysis.report.bestXI.length > 0 && (
          <Card className="p-4">
            <SectionEyebrow color="#34D399">Best XI (estimated)</SectionEyebrow>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {analysis.report.bestXI.map((entry, index) => (
                <span
                  key={index}
                  className="rounded-[7px] bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] text-ink-400"
                  title={entry.reason}
                >
                  {jerseyGlyph(entry.jerseyNumber)} · {entry.position}
                </span>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4">
          <SectionEyebrow>Report sections</SectionEyebrow>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {REPORT_SECTIONS.map((section) => (
              <span
                key={section}
                className="rounded-[7px] bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] text-ink-400"
              >
                {section}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-[1.5] text-mute-3">
            Coverage: {analysis.dataQuality.coverage}
          </p>
          {analysis.dataQuality.caveats.map((caveat, index) => (
            <p key={index} className="mt-1.5 text-[11.5px] text-warn/85">
              {caveat}
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
}
