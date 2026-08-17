import type { SportsAnalysis } from "@/types/sports-analysis";
import { createZip, type ZipEntry } from "@/lib/zip";
import { slugifyFilename } from "@/lib/clip";

type Row = Record<string, string | number | boolean | null>;

function csvCell(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Row[]): string {
  if (rows.length === 0) return "";
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const header = columns.map(csvCell).join(",");
  const body = rows.map((row) => columns.map((column) => csvCell(row[column] ?? "")).join(","));
  return [header, ...body].join("\n");
}

export function eventsCsv(analysis: SportsAnalysis): string {
  const rows: Row[] = [
    ...analysis.goals.map((goal) => ({
      timestamp: goal.timestamp,
      event: "goal",
      team: goal.scorerTeam,
      jerseyNumber: goal.scorerJerseyNumber,
      detail: `${goal.kickType} — ${goal.kickAngle}`,
      description: goal.description,
    })),
    ...analysis.shots.map((shot) => ({
      timestamp: shot.timestamp,
      event: `shot (${shot.outcome})`,
      team: shot.team,
      jerseyNumber: shot.shooterJerseyNumber,
      detail: `${shot.shotType}, ${shot.distanceM} m, xG ${shot.xG}`,
      description: shot.onTarget ? "on target" : "off target",
    })),
    ...analysis.defensiveActions.map((action) => ({
      timestamp: action.timestamp,
      event: action.actionType,
      team: action.team,
      jerseyNumber: action.jerseyNumber,
      detail: action.successful ? "successful" : "unsuccessful",
      description: action.description,
    })),
    ...analysis.refereeDecisions.map((decision) => ({
      timestamp: decision.timestamp,
      event: decision.type,
      team: decision.team,
      jerseyNumber: decision.jerseyNumber,
      detail: "",
      description: decision.description,
    })),
    ...analysis.timeline.map((event) => ({
      timestamp: event.timestamp,
      event: event.type,
      team: event.team,
      jerseyNumber: event.jerseyNumber ?? "",
      detail: event.title,
      description: event.description,
    })),
  ];

  return toCsv(rows.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp))));
}

export function playersCsv(analysis: SportsAnalysis): string {
  return toCsv(
    analysis.players.map((player) => ({
      jerseyNumber: player.jerseyNumber,
      team: player.team,
      position: player.position,
      role: player.role,
      captain: player.isCaptain,
      foot: player.footPreference,
      height: player.estimatedHeight,
      confidence: player.confidence,
      distanceCoveredM: player.tracking.distanceCoveredM,
      topSpeedKmh: player.tracking.topSpeedKmh,
      sprints: player.tracking.sprintCount,
      possessionTimeSec: player.tracking.possessionTimeSec,
      touches: player.stats.touches,
      passesAttempted: player.stats.passesAttempted,
      passesCompleted: player.stats.passesCompleted,
      passAccuracy: player.stats.passAccuracy,
      shots: player.stats.shots,
      shotsOnTarget: player.stats.shotsOnTarget,
      goals: player.stats.goals,
      assists: player.stats.assists,
      tackles: player.stats.tackles,
      interceptions: player.stats.interceptions,
      clearances: player.stats.clearances,
      duelsWon: player.stats.duelsWon,
      foulsCommitted: player.stats.foulsCommitted,
      overallRating: player.ratings.overall,
    }))
  );
}

export function passesCsv(analysis: SportsAnalysis): string {
  return toCsv(
    analysis.passes.map((pass) => ({
      timestamp: pass.timestamp,
      team: pass.team,
      passer: pass.passerJerseyNumber,
      receiver: pass.receiverJerseyNumber ?? "",
      distanceM: pass.distanceM,
      height: pass.passHeight,
      speedKmh: pass.speedKmh,
      direction: pass.direction,
      angleDeg: pass.angleDeg,
      accuracy: pass.accuracyScore,
      successful: pass.successful,
      progressive: pass.progressive,
      throughBall: pass.throughBall,
      cross: pass.cross,
      longBall: pass.longBall,
      backPass: pass.backPass,
      startX: pass.start.x,
      startY: pass.start.y,
      endX: pass.end.x,
      endY: pass.end.y,
    }))
  );
}

export function kicksCsv(analysis: SportsAnalysis): string {
  return toCsv(
    analysis.kicks.map((kick) => ({
      timestamp: kick.timestamp,
      team: kick.team,
      jerseyNumber: kick.jerseyNumber,
      kickType: kick.kickType,
      foot: kick.foot,
      contactPoint: kick.contactPoint,
      ballSpeedKmh: kick.ballSpeedKmh,
      launchSpeedKmh: kick.launchSpeedKmh,
      launchAngleDeg: kick.launchAngleDeg,
      groundAngleDeg: kick.groundAngleDeg,
      elevationAngleDeg: kick.elevationAngleDeg,
      directionDeg: kick.directionDeg,
      powerPercent: kick.powerPercent,
      estimatedForceN: kick.estimatedForceN,
      followThrough: kick.followThrough,
      accuracyScore: kick.accuracyScore,
    }))
  );
}

export function touchesCsv(analysis: SportsAnalysis): string {
  return toCsv(
    analysis.touches.map((touch) => ({
      timestamp: touch.timestamp,
      team: touch.team,
      jerseyNumber: touch.jerseyNumber,
      touchType: touch.touchType,
      firstTouchQuality: touch.firstTouchQuality,
      direction: touch.direction,
      pressure: touch.pressure,
      distanceAfterM: touch.distanceAfterM,
      notes: touch.notes,
    }))
  );
}

export function teamStatsCsv(analysis: SportsAnalysis): string {
  return toCsv(analysis.teamStats.map((stats) => ({ ...stats })));
}

export function improvementsCsv(analysis: SportsAnalysis): string {
  return toCsv(analysis.improvements.map((item) => ({ ...item })));
}

export function scoutingCsv(analysis: SportsAnalysis): string {
  return toCsv(
    analysis.players.map((player) => ({
      jerseyNumber: player.jerseyNumber,
      team: player.team,
      position: player.position,
      overallRating: player.ratings.overall,
      summary: player.scouting.summary,
      strengths: player.scouting.strengths.join(" | "),
      weaknesses: player.scouting.weaknesses.join(" | "),
      coachingNote: player.scouting.coachingNote,
      standoutMoments: player.scouting.standoutMoments.join(" | "),
      ratingJustification: player.ratings.justification,
    }))
  );
}

export function highlightsCsv(analysis: SportsAnalysis): string {
  return toCsv(
    analysis.highlights.map((highlight) => ({
      id: highlight.id,
      type: highlight.type,
      start: highlight.startTimestamp,
      end: highlight.endTimestamp,
      title: highlight.title,
      team: highlight.team,
      players: highlight.playersInvolved.join(" / "),
      importance: highlight.importance,
      description: highlight.description,
    }))
  );
}

function bullets(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- (none recorded)";
}

export function matchReportMarkdown(analysis: SportsAnalysis): string {
  const [teamA, teamB] = analysis.teamStats;
  const statRow = (label: string, a: string | number, b: string | number) =>
    `| ${label} | ${a} | ${b} |`;

  return `# Match Report — ${analysis.metadata.title}

**Sport:** ${analysis.sport}
**Final score:** ${analysis.report.finalScore}
**Source:** ${analysis.metadata.source}
**Duration:** ${analysis.videoInfo.duration}

## Summary

${analysis.matchSummary.short}

${analysis.matchSummary.detailed}

## Video information

| Field | Value |
| --- | --- |
| Resolution | ${analysis.videoInfo.resolution} |
| Frame rate | ${analysis.videoInfo.fps} |
| Camera | ${analysis.videoInfo.cameraType} (${analysis.videoInfo.cameraMovement}) |
| Weather | ${analysis.videoInfo.weather} |
| Time of day | ${analysis.videoInfo.timeOfDay} |
| Venue | ${analysis.videoInfo.stadium} |
| Pitch | ${analysis.videoInfo.pitchDimensions} |
| Video quality | ${analysis.videoInfo.videoQualityScore}/10 |
| Visibility | ${analysis.videoInfo.visibilityScore}/10 |

## Team statistics

| Metric | ${teamA?.teamName ?? "Team A"} | ${teamB?.teamName ?? "Team B"} |
| --- | --- | --- |
${[
  statRow("Goals", teamA?.goals ?? 0, teamB?.goals ?? 0),
  statRow("Possession %", teamA?.possessionPercent ?? 0, teamB?.possessionPercent ?? 0),
  statRow("Shots", teamA?.shots ?? 0, teamB?.shots ?? 0),
  statRow("Shots on target", teamA?.shotsOnTarget ?? 0, teamB?.shotsOnTarget ?? 0),
  statRow("xG", teamA?.xG ?? 0, teamB?.xG ?? 0),
  statRow("Pass accuracy %", teamA?.passAccuracy ?? 0, teamB?.passAccuracy ?? 0),
  statRow("Fouls", teamA?.fouls ?? 0, teamB?.fouls ?? 0),
  statRow("Corners", teamA?.corners ?? 0, teamB?.corners ?? 0),
  statRow("Yellow cards", teamA?.yellowCards ?? 0, teamB?.yellowCards ?? 0),
  statRow("Red cards", teamA?.redCards ?? 0, teamB?.redCards ?? 0),
  statRow("Distance covered (km)", teamA?.distanceCoveredKm ?? 0, teamB?.distanceCoveredKm ?? 0),
  statRow("Sprints", teamA?.sprints ?? 0, teamB?.sprints ?? 0),
].join("\n")}

## Goals

${
  analysis.goals.length > 0
    ? analysis.goals
        .map(
          (goal) =>
            `### ${goal.timestamp} — #${goal.scorerJerseyNumber} (${goal.scorerTeam})\n\n` +
            `- Kick: ${goal.kickType}\n- Angle: ${goal.kickAngle}\n` +
            `- Assist: ${goal.assistJerseyNumber ? `#${goal.assistJerseyNumber}` : "none"}\n` +
            `- Build-up: ${goal.buildUp}\n- Goalkeeper: ${goal.goalkeeperPosition}\n\n${goal.description}`
        )
        .join("\n\n")
    : "No goals detected in this footage."
}

## Player ratings

| # | Team | Position | Overall | Attack | Passing | Defending | Work rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
${analysis.players
  .map(
    (player) =>
      `| ${player.jerseyNumber} | ${player.team} | ${player.position} | ${player.ratings.overall} | ${player.ratings.attack} | ${player.ratings.passing} | ${player.ratings.defending} | ${player.ratings.workRate} |`
  )
  .join("\n")}

## Awards

${bullets(
  analysis.awards.map((award) => `**${award.category}** — #${award.jerseyNumber} (${award.team}): ${award.reason}`)
)}

## Tactical analysis

${analysis.tactics
  .map(
    (tactic) =>
      `### ${tactic.teamName}\n\n- Formation: ${tactic.formation}\n- Shape: ${tactic.shape}\n- Defensive line: ${tactic.defensiveLine}\n- Pressing height: ${tactic.pressingHeight}\n- Compactness: ${tactic.compactness}\n- Build-up: ${tactic.buildUpPattern}\n- Counter attack: ${tactic.counterAttack}\n- Wing play: ${tactic.wingPlay}\n- Central attack: ${tactic.centralAttack}\n- Transition speed: ${tactic.transitionSpeed}`
  )
  .join("\n\n")}

${analysis.report.tacticalSummary}

## Strengths and weaknesses

**${analysis.playerCount.teamA.name} strengths**
${bullets(analysis.report.teamAStrengths)}

**${analysis.playerCount.teamA.name} weaknesses**
${bullets(analysis.report.teamAWeaknesses)}

**${analysis.playerCount.teamB.name} strengths**
${bullets(analysis.report.teamBStrengths)}

**${analysis.playerCount.teamB.name} weaknesses**
${bullets(analysis.report.teamBWeaknesses)}

## Best XI (estimated)

${bullets(
  analysis.report.bestXI.map((entry) => `${entry.position} — #${entry.jerseyNumber} (${entry.team}): ${entry.reason}`)
)}

## Themed analysis

${(
  [
    ["Attacking play", analysis.narratives.attacking],
    ["Defending", analysis.narratives.defending],
    ["Passing & circulation", analysis.narratives.passing],
    ["Physical output", analysis.narratives.physical],
    ["Goalkeeping", analysis.narratives.goalkeeping],
    ["Set pieces", analysis.narratives.setPieces],
    ["Refereeing", analysis.narratives.refereeing],
    ["Momentum", analysis.narratives.momentum],
  ] as const
)
  .filter(([, text]) => text)
  .map(([label, text]) => `### ${label}\n\n${text}`)
  .join("\n\n") || "_No themed analysis was produced._"}

## Turning points

${bullets(
  analysis.turningPoints.map(
    (point) => `**${point.timestamp} — ${point.title}** ${point.description}${point.impact ? ` _(Impact: ${point.impact})_` : ""}`
  )
)}

## Key battles

${bullets(
  analysis.keyBattles.map(
    (battle) => `**${battle.matchup}** ${battle.description}${battle.winner ? ` _(Edge: ${battle.winner})_` : ""}`
  )
)}

## Coaching improvements

${bullets(
  analysis.improvements.map((item) =>
    [
      `**${item.area}**`,
      item.jerseyNumber && item.jerseyNumber !== "team" ? `#${item.jerseyNumber}` : null,
      item.team || null,
      item.timestamp ? `(${item.timestamp})` : null,
      `— ${item.issue}`,
      item.recommendation ? `Fix: ${item.recommendation}` : null,
      item.drill ? `Drill: ${item.drill}` : null,
    ]
      .filter(Boolean)
      .join(" ")
  )
)}

## Tactical insights

${bullets(analysis.tacticalInsights)}

## Event timeline

${
  analysis.timeline.length > 0
    ? analysis.timeline.map((event) => `- **${event.timestamp}** ${event.title} — ${event.description}`).join("\n")
    : "- (no timeline events recorded)"
}

## Data quality

- Coverage: ${analysis.dataQuality.coverage}
- Estimated fields: ${analysis.dataQuality.estimatedFields.join(", ") || "none flagged"}
${analysis.dataQuality.caveats.map((caveat) => `- Caveat: ${caveat}`).join("\n")}

_All measurements are AI estimates derived from the footage._
`;
}

export interface BundleClip {
  filename: string;
  blob: Blob;
}

export function analysisFileEntries(analysis: SportsAnalysis): ZipEntry[] {
  const entries: ZipEntry[] = [
    { name: "match-report.md", data: matchReportMarkdown(analysis) },
    { name: "analysis.json", data: JSON.stringify(analysis, null, 2) },
    { name: "csv/events.csv", data: eventsCsv(analysis) },
    { name: "csv/players.csv", data: playersCsv(analysis) },
    { name: "csv/team-stats.csv", data: teamStatsCsv(analysis) },
    { name: "csv/highlights.csv", data: highlightsCsv(analysis) },
    { name: "csv/scouting.csv", data: scoutingCsv(analysis) },
    { name: "csv/improvements.csv", data: improvementsCsv(analysis) },
  ];

  if (analysis.passes.length > 0) entries.push({ name: "csv/passes.csv", data: passesCsv(analysis) });
  if (analysis.kicks.length > 0) entries.push({ name: "csv/kicks.csv", data: kicksCsv(analysis) });
  if (analysis.touches.length > 0) entries.push({ name: "csv/touches.csv", data: touchesCsv(analysis) });

  return entries;
}

export async function buildAnalysisZip(
  analysis: SportsAnalysis,
  clips: BundleClip[] = []
): Promise<Blob> {
  return createZip([
    ...analysisFileEntries(analysis),
    ...clips.map((clip) => ({ name: `clips/${clip.filename}`, data: clip.blob })),
  ]);
}

export function analysisBundleName(analysis: SportsAnalysis): string {
  return `${slugifyFilename(analysis.metadata.title || "match")}-analysis`;
}
