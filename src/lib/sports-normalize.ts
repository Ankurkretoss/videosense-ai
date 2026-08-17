import type { VideoMetadata } from "@/types/analysis";
import type {
  Award,
  BallAnalysis,
  BestXIEntry,
  DataQuality,
  DefensiveAction,
  DefensiveActionType,
  GoalEvent,
  GoalkeeperAnalysis,
  HeatmapZone,
  Highlight,
  HighlightType,
  Improvement,
  KeyBattle,
  KickEvent,
  MatchPhase,
  MatchReport,
  MatchTimelineEvent,
  PlayerScouting,
  SectionNarratives,
  TurningPoint,
  PassEvent,
  PathPoint,
  PitchPoint,
  PlayerCount,
  PlayerRatings,
  PlayerStats,
  PlayerTracking,
  RefereeDecision,
  RefereeDecisionType,
  ShotEvent,
  ShotOutcome,
  SportsAnalysis,
  SportsPlayer,
  TeamId,
  TeamInfo,
  TeamStats,
  TeamTactics,
  TouchEvent,
  VideoInfo,
} from "@/types/sports-analysis";
import { secondsToTimestamp, timeToSeconds } from "@/lib/time";

/* eslint-disable @typescript-eslint/no-explicit-any */

const MIN_CLIP_SECONDS = 3;
const MAX_CLIP_SECONDS = 20;

function str(value: any, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function num(value: any, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * When a shirt number is never legible the model hands back a placeholder such as
 * "unknown_maroon_1" so the player stays identifiable across events. Keep those,
 * but trim them to something that can be rendered.
 */
function jersey(value: any): string {
  const raw = str(value).replace(/\s+/g, "_").replace(/^#/, "");
  if (!raw) return "unknown";
  if (/^\d{1,3}$/.test(raw)) return String(parseInt(raw, 10));
  return raw.slice(0, 24);
}

function bool(value: any, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return /^(true|yes|y|1)$/i.test(value.trim());
  return fallback;
}

function list(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function stringList(value: any): string[] {
  return list(value)
    .map((item) => (typeof item === "string" ? item.trim() : str(item)))
    .filter(Boolean);
}

function oneOf<T extends string>(value: any, allowed: readonly T[], fallback: T): T {
  const normalized = str(value).toLowerCase().replace(/\s+/g, "-");
  return (allowed as readonly string[]).includes(normalized) ? (normalized as T) : fallback;
}

function point(value: any): PitchPoint {
  return {
    x: clamp(num(value?.x, 50), 0, 100),
    y: clamp(num(value?.y, 50), 0, 100),
  };
}

function normalizeTimestamp(value: any, maxSeconds: number): string {
  const seconds = timeToSeconds(str(value));
  const bounded = maxSeconds > 0 ? clamp(seconds, 0, maxSeconds) : Math.max(0, seconds);
  return secondsToTimestamp(bounded);
}

function normalizeTeamInfo(raw: any, id: TeamId, fallbackName: string): TeamInfo {
  return {
    id,
    name: str(raw?.name, fallbackName) || fallbackName,
    shirtColor: str(raw?.shirtColor, "unknown"),
    shortsColor: str(raw?.shortsColor, "unknown"),
    playerCount: Math.max(0, Math.round(num(raw?.playerCount))),
    formation: str(raw?.formation, "Estimated: unclear"),
  };
}

function normalizeVideoInfo(raw: any, metadata: VideoMetadata): VideoInfo {
  return {
    duration: str(raw?.duration, metadata.duration),
    fps: str(raw?.fps, "Estimated"),
    resolution: str(raw?.resolution, metadata.resolution),
    cameraType: str(raw?.cameraType, "Estimated"),
    cameraMovement: str(raw?.cameraMovement, "Estimated"),
    weather: str(raw?.weather, "Not visible"),
    timeOfDay: str(raw?.timeOfDay, "Not visible"),
    stadium: str(raw?.stadium, "Unknown"),
    pitchDimensions: str(raw?.pitchDimensions, "Estimated"),
    videoQualityScore: clamp(num(raw?.videoQualityScore), 0, 10),
    visibilityScore: clamp(num(raw?.visibilityScore), 0, 10),
    notes: str(raw?.notes),
  };
}

function normalizeTracking(raw: any, maxSeconds: number): PlayerTracking {
  const heatmapZones: HeatmapZone[] = list(raw?.heatmapZones)
    .slice(0, 24)
    .map((zone) => ({ ...point(zone), intensity: clamp(num(zone?.intensity), 0, 100) }));

  const movementPath: PathPoint[] = list(raw?.movementPath)
    .slice(0, 40)
    .map((step) => ({ ...point(step), timestamp: normalizeTimestamp(step?.timestamp, maxSeconds) }));

  return {
    distanceCoveredM: Math.max(0, num(raw?.distanceCoveredM)),
    topSpeedKmh: Math.max(0, num(raw?.topSpeedKmh)),
    avgSpeedKmh: Math.max(0, num(raw?.avgSpeedKmh)),
    sprintCount: Math.max(0, Math.round(num(raw?.sprintCount))),
    possessionTimeSec: Math.max(0, num(raw?.possessionTimeSec)),
    timeOnScreenSec: Math.max(0, num(raw?.timeOnScreenSec)),
    walkingTimeSec: Math.max(0, num(raw?.walkingTimeSec)),
    standingTimeSec: Math.max(0, num(raw?.standingTimeSec)),
    heatmapZones,
    movementPath,
  };
}

function normalizeStats(raw: any): PlayerStats {
  const passesAttempted = Math.max(0, Math.round(num(raw?.passesAttempted)));
  const passesCompleted = clamp(Math.round(num(raw?.passesCompleted)), 0, passesAttempted);
  const derivedAccuracy =
    passesAttempted > 0 ? Math.round((passesCompleted / passesAttempted) * 100) : 0;

  return {
    touches: Math.max(0, Math.round(num(raw?.touches))),
    passesAttempted,
    passesCompleted,
    passAccuracy: clamp(num(raw?.passAccuracy, derivedAccuracy), 0, 100),
    shots: Math.max(0, Math.round(num(raw?.shots))),
    shotsOnTarget: Math.max(0, Math.round(num(raw?.shotsOnTarget))),
    goals: Math.max(0, Math.round(num(raw?.goals))),
    assists: Math.max(0, Math.round(num(raw?.assists))),
    tackles: Math.max(0, Math.round(num(raw?.tackles))),
    interceptions: Math.max(0, Math.round(num(raw?.interceptions))),
    clearances: Math.max(0, Math.round(num(raw?.clearances))),
    duelsWon: Math.max(0, Math.round(num(raw?.duelsWon))),
    foulsCommitted: Math.max(0, Math.round(num(raw?.foulsCommitted))),
    foulsWon: Math.max(0, Math.round(num(raw?.foulsWon))),
  };
}

function normalizeRatings(raw: any): PlayerRatings {
  const rating = (value: any) => Math.round(clamp(num(value), 0, 10) * 10) / 10;
  const overall = rating(raw?.overall);
  const parts = [
    rating(raw?.attack),
    rating(raw?.passing),
    rating(raw?.defending),
    rating(raw?.positioning),
    rating(raw?.movement),
    rating(raw?.vision),
    rating(raw?.decisionMaking),
    rating(raw?.ballControl),
    rating(raw?.workRate),
  ];
  const average = Math.round((parts.reduce((sum, part) => sum + part, 0) / parts.length) * 10) / 10;

  return {
    attack: parts[0],
    passing: parts[1],
    defending: parts[2],
    positioning: parts[3],
    movement: parts[4],
    vision: parts[5],
    decisionMaking: parts[6],
    ballControl: parts[7],
    workRate: parts[8],
    overall: overall > 0 ? overall : average,
    justification: str(raw?.justification),
  };
}

function normalizeScouting(raw: any, fallbackNote: string): PlayerScouting {
  return {
    summary: str(raw?.summary, fallbackNote),
    strengths: stringList(raw?.strengths),
    weaknesses: stringList(raw?.weaknesses),
    coachingNote: str(raw?.coachingNote),
    standoutMoments: stringList(raw?.standoutMoments),
  };
}

function normalizePlayers(raw: any, teams: PlayerCount, maxSeconds: number): SportsPlayer[] {
  const teamAName = teams.teamA.name.toLowerCase();

  return list(raw).map((player, index) => {
    const teamName = str(player?.team, teams.teamA.name);
    const declaredTeamId = str(player?.teamId).toUpperCase();
    const teamId: TeamId =
      declaredTeamId === "A" || declaredTeamId === "B"
        ? (declaredTeamId as TeamId)
        : teamName.toLowerCase() === teamAName
          ? "A"
          : "B";
    const isGoalkeeper =
      bool(player?.isGoalkeeper) || str(player?.role).toLowerCase() === "goalkeeper";

    return {
      id: str(player?.id, `p${index + 1}`) || `p${index + 1}`,
      jerseyNumber: jersey(player?.jerseyNumber),
      team: teamName,
      teamId,
      role: isGoalkeeper ? "goalkeeper" : "outfield",
      position: str(player?.position, isGoalkeeper ? "Goalkeeper" : "Estimated"),
      jerseyColor: str(player?.jerseyColor, teamId === "A" ? teams.teamA.shirtColor : teams.teamB.shirtColor),
      shortsColor: str(player?.shortsColor),
      socksColor: str(player?.socksColor),
      isCaptain: bool(player?.isCaptain),
      isGoalkeeper,
      estimatedHeight: str(player?.estimatedHeight),
      footPreference: str(player?.footPreference, "unknown"),
      confidence: clamp(num(player?.confidence, 50), 0, 100),
      notes: str(player?.notes),
      tracking: normalizeTracking(player?.tracking, maxSeconds),
      stats: normalizeStats(player?.stats),
      ratings: normalizeRatings(player?.ratings),
      scouting: normalizeScouting(player?.scouting, str(player?.ratings?.justification)),
    };
  });
}

function normalizeBallAnalysis(raw: any): BallAnalysis {
  return {
    avgSpeedKmh: Math.max(0, num(raw?.avgSpeedKmh)),
    maxSpeedKmh: Math.max(0, num(raw?.maxSpeedKmh)),
    maxHeightM: Math.max(0, num(raw?.maxHeightM)),
    longestPassM: Math.max(0, num(raw?.longestPassM)),
    longestShotM: Math.max(0, num(raw?.longestShotM)),
    bounceCount: Math.max(0, Math.round(num(raw?.bounceCount))),
    airTimeSec: Math.max(0, num(raw?.airTimeSec)),
    groundContacts: Math.max(0, Math.round(num(raw?.groundContacts))),
    trajectoryNotes: str(raw?.trajectoryNotes),
  };
}

function byTimestamp<T extends { timestamp: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => timeToSeconds(a.timestamp) - timeToSeconds(b.timestamp));
}

function normalizeTouches(raw: any, maxSeconds: number): TouchEvent[] {
  return byTimestamp(
    list(raw).map((touch) => ({
      timestamp: normalizeTimestamp(touch?.timestamp, maxSeconds),
      jerseyNumber: jersey(touch?.jerseyNumber),
      team: str(touch?.team),
      touchType: str(touch?.touchType),
      firstTouchQuality: str(touch?.firstTouchQuality),
      direction: str(touch?.direction),
      pressure: str(touch?.pressure),
      distanceAfterM: Math.max(0, num(touch?.distanceAfterM)),
      notes: str(touch?.notes),
    }))
  );
}

function normalizePasses(raw: any, maxSeconds: number): PassEvent[] {
  return byTimestamp(
    list(raw).map((pass) => ({
      timestamp: normalizeTimestamp(pass?.timestamp, maxSeconds),
      passerJerseyNumber: jersey(pass?.passerJerseyNumber),
      receiverJerseyNumber: pass?.receiverJerseyNumber ? jersey(pass.receiverJerseyNumber) : null,
      team: str(pass?.team),
      distanceM: Math.max(0, num(pass?.distanceM)),
      passHeight: str(pass?.passHeight, "ground"),
      speedKmh: Math.max(0, num(pass?.speedKmh)),
      direction: str(pass?.direction),
      angleDeg: num(pass?.angleDeg),
      accuracyScore: clamp(num(pass?.accuracyScore), 0, 100),
      successful: bool(pass?.successful, Boolean(pass?.receiverJerseyNumber)),
      progressive: bool(pass?.progressive),
      throughBall: bool(pass?.throughBall),
      cross: bool(pass?.cross),
      longBall: bool(pass?.longBall),
      backPass: bool(pass?.backPass),
      start: point(pass?.start),
      end: point(pass?.end),
    }))
  );
}

function normalizeKicks(raw: any, maxSeconds: number): KickEvent[] {
  return byTimestamp(
    list(raw).map((kick) => ({
      timestamp: normalizeTimestamp(kick?.timestamp, maxSeconds),
      jerseyNumber: jersey(kick?.jerseyNumber),
      team: str(kick?.team),
      kickType: str(kick?.kickType),
      foot: oneOf(kick?.foot, ["left", "right", "unknown"] as const, "unknown"),
      contactPoint: str(kick?.contactPoint),
      ballSpeedKmh: Math.max(0, num(kick?.ballSpeedKmh)),
      launchSpeedKmh: Math.max(0, num(kick?.launchSpeedKmh)),
      launchAngleDeg: num(kick?.launchAngleDeg),
      groundAngleDeg: num(kick?.groundAngleDeg),
      elevationAngleDeg: num(kick?.elevationAngleDeg),
      directionDeg: num(kick?.directionDeg),
      powerPercent: clamp(num(kick?.powerPercent), 0, 100),
      estimatedForceN: Math.max(0, num(kick?.estimatedForceN)),
      followThrough: str(kick?.followThrough),
      accuracyScore: clamp(num(kick?.accuracyScore), 0, 100),
    }))
  );
}

const SHOT_OUTCOMES = ["goal", "saved", "blocked", "off-target", "post", "deflected"] as const;

function normalizeShots(raw: any, maxSeconds: number): ShotEvent[] {
  return byTimestamp(
    list(raw).map((shot) => {
      const outcome = oneOf<ShotOutcome>(shot?.outcome, SHOT_OUTCOMES, "off-target");
      return {
        timestamp: normalizeTimestamp(shot?.timestamp, maxSeconds),
        shooterJerseyNumber: jersey(shot?.shooterJerseyNumber),
        team: str(shot?.team),
        shotType: str(shot?.shotType),
        description: str(shot?.description),
        assistJerseyNumber: shot?.assistJerseyNumber ? jersey(shot.assistJerseyNumber) : null,
        distanceM: Math.max(0, num(shot?.distanceM)),
        speedKmh: Math.max(0, num(shot?.speedKmh)),
        angleDeg: num(shot?.angleDeg),
        xG: clamp(num(shot?.xG), 0, 1),
        onTarget: bool(shot?.onTarget, outcome === "goal" || outcome === "saved"),
        outcome,
        blocked: bool(shot?.blocked, outcome === "blocked"),
        deflection: bool(shot?.deflection, outcome === "deflected"),
        location: point(shot?.location),
      };
    })
  );
}

function normalizeGoals(raw: any, maxSeconds: number): GoalEvent[] {
  return byTimestamp(
    list(raw).map((goal) => ({
      timestamp: normalizeTimestamp(goal?.timestamp, maxSeconds),
      scorerJerseyNumber: jersey(goal?.scorerJerseyNumber),
      scorerTeam: str(goal?.scorerTeam),
      assistJerseyNumber: goal?.assistJerseyNumber ? jersey(goal.assistJerseyNumber) : null,
      kickType: str(goal?.kickType),
      kickAngle: str(goal?.kickAngle),
      description: str(goal?.description),
      buildUp: str(goal?.buildUp),
      passSequence: stringList(goal?.passSequence),
      defensiveErrors: stringList(goal?.defensiveErrors),
      goalkeeperPosition: str(goal?.goalkeeperPosition),
      goalProbability: clamp(num(goal?.goalProbability), 0, 100),
      celebrationTimestamp: goal?.celebrationTimestamp
        ? normalizeTimestamp(goal.celebrationTimestamp, maxSeconds)
        : null,
    }))
  );
}

const DEFENSIVE_TYPES = [
  "tackle",
  "interception",
  "block",
  "clearance",
  "pressure",
  "duel",
  "error",
] as const;

function normalizeDefensiveActions(raw: any, maxSeconds: number): DefensiveAction[] {
  return byTimestamp(
    list(raw).map((action) => ({
      timestamp: normalizeTimestamp(action?.timestamp, maxSeconds),
      jerseyNumber: jersey(action?.jerseyNumber),
      team: str(action?.team),
      actionType: oneOf<DefensiveActionType>(action?.actionType, DEFENSIVE_TYPES, "pressure"),
      successful: bool(action?.successful, true),
      description: str(action?.description),
    }))
  );
}

const REFEREE_TYPES = [
  "foul",
  "yellow-card",
  "red-card",
  "handball",
  "offside",
  "advantage",
  "free-kick",
  "penalty",
] as const;

function normalizeRefereeDecisions(raw: any, maxSeconds: number): RefereeDecision[] {
  return byTimestamp(
    list(raw).map((decision) => ({
      timestamp: normalizeTimestamp(decision?.timestamp, maxSeconds),
      type: oneOf<RefereeDecisionType>(decision?.type, REFEREE_TYPES, "foul"),
      jerseyNumber: jersey(decision?.jerseyNumber),
      team: str(decision?.team),
      description: str(decision?.description),
    }))
  );
}

function normalizeTimeline(raw: any, maxSeconds: number): MatchTimelineEvent[] {
  return byTimestamp(
    list(raw).map((event) => ({
      timestamp: normalizeTimestamp(event?.timestamp, maxSeconds),
      type: str(event?.type, "event"),
      title: str(event?.title, "Match event"),
      description: str(event?.description),
      team: str(event?.team),
      jerseyNumber: event?.jerseyNumber ? jersey(event.jerseyNumber) : null,
    }))
  );
}

const HIGHLIGHT_TYPES = [
  "goal",
  "shot-on-target",
  "shot-off-target",
  "key-pass",
  "long-pass",
  "cross",
  "save",
  "foul",
  "card",
  "skill",
  "dribble",
  "tackle",
  "interception",
  "corner",
  "free-kick",
  "penalty",
  "celebration",
  "fast-break",
  "mistake",
  "other",
] as const;

function normalizeHighlights(raw: any, maxSeconds: number): Highlight[] {
  const highlights = list(raw).map((highlight, index) => {
    const start = timeToSeconds(str(highlight?.startTimestamp));
    const rawEnd = timeToSeconds(str(highlight?.endTimestamp));
    const span = clamp(
      rawEnd > start ? rawEnd - start : MIN_CLIP_SECONDS + 3,
      MIN_CLIP_SECONDS,
      MAX_CLIP_SECONDS
    );
    // Keep the window's length when a timestamp lands at the very end of the clip.
    const boundedEnd =
      maxSeconds > 0 ? Math.min(Math.max(start, 0) + span, maxSeconds) : Math.max(0, start) + span;
    const boundedStart = Math.max(0, Math.min(Math.max(start, 0), boundedEnd - span));

    return {
      id: str(highlight?.id, `h${index + 1}`) || `h${index + 1}`,
      type: oneOf<HighlightType>(highlight?.type, HIGHLIGHT_TYPES, "other"),
      startTimestamp: secondsToTimestamp(boundedStart),
      endTimestamp: secondsToTimestamp(boundedEnd),
      title: str(highlight?.title, "Highlight"),
      description: str(highlight?.description),
      playersInvolved: stringList(highlight?.playersInvolved).map(jersey),
      team: str(highlight?.team),
      importance: clamp(num(highlight?.importance, 50), 0, 100),
    };
  });

  const seen = new Set<string>();
  return highlights
    .map((highlight) => {
      let id = highlight.id;
      let suffix = 2;
      while (seen.has(id)) {
        id = `${highlight.id}-${suffix++}`;
      }
      seen.add(id);
      return { ...highlight, id };
    })
    .sort((a, b) => timeToSeconds(a.startTimestamp) - timeToSeconds(b.startTimestamp));
}

function normalizeGoalkeepers(raw: any): GoalkeeperAnalysis[] {
  return list(raw).map((keeper) => ({
    jerseyNumber: jersey(keeper?.jerseyNumber),
    team: str(keeper?.team),
    saves: Math.max(0, Math.round(num(keeper?.saves))),
    goalsConceded: Math.max(0, Math.round(num(keeper?.goalsConceded))),
    saveDifficulty: str(keeper?.saveDifficulty),
    reflexTimeSec: Math.max(0, num(keeper?.reflexTimeSec)),
    distributionAccuracy: clamp(num(keeper?.distributionAccuracy), 0, 100),
    catchSuccess: clamp(num(keeper?.catchSuccess), 0, 100),
    punches: Math.max(0, Math.round(num(keeper?.punches))),
    errors: stringList(keeper?.errors),
    positioning: str(keeper?.positioning),
    notes: str(keeper?.notes),
  }));
}

function normalizeTactics(raw: any, teams: PlayerCount): TeamTactics[] {
  return list(raw).map((tactic, index) => {
    const teamId: TeamId = str(tactic?.teamId).toUpperCase() === "B" ? "B" : index === 1 ? "B" : "A";
    return {
      teamId,
      teamName: str(tactic?.teamName, teamId === "A" ? teams.teamA.name : teams.teamB.name),
      formation: str(tactic?.formation, "Estimated"),
      shape: str(tactic?.shape),
      teamWidthM: Math.max(0, num(tactic?.teamWidthM)),
      defensiveLine: str(tactic?.defensiveLine),
      pressingHeight: str(tactic?.pressingHeight),
      compactness: str(tactic?.compactness),
      buildUpPattern: str(tactic?.buildUpPattern),
      counterAttack: str(tactic?.counterAttack),
      wingPlay: str(tactic?.wingPlay),
      centralAttack: str(tactic?.centralAttack),
      transitionSpeed: str(tactic?.transitionSpeed),
    };
  });
}

function derivedTeamStats(
  teamId: TeamId,
  teams: PlayerCount,
  players: SportsPlayer[],
  passes: PassEvent[],
  shots: ShotEvent[],
  goals: GoalEvent[],
  refereeDecisions: RefereeDecision[],
  defensiveActions: DefensiveAction[],
  goalkeepers: GoalkeeperAnalysis[]
): TeamStats {
  const info = teamId === "A" ? teams.teamA : teams.teamB;
  const teamName = info.name;
  const matchesTeam = (value: string) => value.toLowerCase() === teamName.toLowerCase();
  const teamPlayers = players.filter((player) => player.teamId === teamId);
  const teamPasses = passes.filter((pass) => matchesTeam(pass.team));
  const teamShots = shots.filter((shot) => matchesTeam(shot.team));
  const completed = teamPasses.filter((pass) => pass.successful).length;
  const decisions = refereeDecisions.filter((decision) => matchesTeam(decision.team));
  const actions = defensiveActions.filter((action) => matchesTeam(action.team));
  const countActions = (type: DefensiveActionType) =>
    actions.filter((action) => action.actionType === type).length;

  return {
    teamId,
    teamName,
    goals: goals.filter((goal) => matchesTeam(goal.scorerTeam)).length,
    possessionPercent: 0,
    shots: teamShots.length,
    shotsOnTarget: teamShots.filter((shot) => shot.onTarget).length,
    bigChances: teamShots.filter((shot) => shot.xG >= 0.25).length,
    xG: Math.round(teamShots.reduce((sum, shot) => sum + shot.xG, 0) * 100) / 100,
    passesAttempted: teamPasses.length,
    passesCompleted: completed,
    passAccuracy: teamPasses.length > 0 ? Math.round((completed / teamPasses.length) * 100) : 0,
    crosses: teamPasses.filter((pass) => pass.cross).length,
    throughBalls: teamPasses.filter((pass) => pass.throughBall).length,
    tackles: countActions("tackle"),
    interceptions: countActions("interception"),
    clearances: countActions("clearance"),
    saves: goalkeepers
      .filter((keeper) => matchesTeam(keeper.team))
      .reduce((sum, keeper) => sum + keeper.saves, 0),
    duelsWon: teamPlayers.reduce((sum, player) => sum + player.stats.duelsWon, 0),
    fouls: decisions.filter((decision) => decision.type === "foul").length,
    corners: 0,
    offsides: decisions.filter((decision) => decision.type === "offside").length,
    yellowCards: decisions.filter((decision) => decision.type === "yellow-card").length,
    redCards: decisions.filter((decision) => decision.type === "red-card").length,
    distanceCoveredKm:
      Math.round(
        (teamPlayers.reduce((sum, player) => sum + player.tracking.distanceCoveredM, 0) / 1000) * 100
      ) / 100,
    sprints: teamPlayers.reduce((sum, player) => sum + player.tracking.sprintCount, 0),
  };
}

function normalizeTeamStats(raw: any, teams: PlayerCount, fallbacks: TeamStats[]): TeamStats[] {
  const byId = new Map<TeamId, TeamStats>();

  for (const entry of list(raw)) {
    const teamId: TeamId = str(entry?.teamId).toUpperCase() === "B" ? "B" : "A";
    const fallback = fallbacks.find((item) => item.teamId === teamId);
    const passesAttempted = Math.max(0, Math.round(num(entry?.passesAttempted, fallback?.passesAttempted)));
    const passesCompleted = clamp(
      Math.round(num(entry?.passesCompleted, fallback?.passesCompleted)),
      0,
      passesAttempted
    );

    byId.set(teamId, {
      teamId,
      teamName: str(entry?.teamName, teamId === "A" ? teams.teamA.name : teams.teamB.name),
      goals: Math.max(0, Math.round(num(entry?.goals, fallback?.goals))),
      possessionPercent: clamp(num(entry?.possessionPercent), 0, 100),
      shots: Math.max(0, Math.round(num(entry?.shots, fallback?.shots))),
      shotsOnTarget: Math.max(0, Math.round(num(entry?.shotsOnTarget, fallback?.shotsOnTarget))),
      bigChances: Math.max(0, Math.round(num(entry?.bigChances, fallback?.bigChances))),
      xG: Math.max(0, num(entry?.xG, fallback?.xG)),
      passesAttempted,
      passesCompleted,
      passAccuracy: clamp(
        num(
          entry?.passAccuracy,
          passesAttempted > 0 ? Math.round((passesCompleted / passesAttempted) * 100) : 0
        ),
        0,
        100
      ),
      crosses: Math.max(0, Math.round(num(entry?.crosses, fallback?.crosses))),
      throughBalls: Math.max(0, Math.round(num(entry?.throughBalls, fallback?.throughBalls))),
      tackles: Math.max(0, Math.round(num(entry?.tackles, fallback?.tackles))),
      interceptions: Math.max(0, Math.round(num(entry?.interceptions, fallback?.interceptions))),
      clearances: Math.max(0, Math.round(num(entry?.clearances, fallback?.clearances))),
      saves: Math.max(0, Math.round(num(entry?.saves, fallback?.saves))),
      duelsWon: Math.max(0, Math.round(num(entry?.duelsWon, fallback?.duelsWon))),
      fouls: Math.max(0, Math.round(num(entry?.fouls, fallback?.fouls))),
      corners: Math.max(0, Math.round(num(entry?.corners, fallback?.corners))),
      offsides: Math.max(0, Math.round(num(entry?.offsides, fallback?.offsides))),
      yellowCards: Math.max(0, Math.round(num(entry?.yellowCards, fallback?.yellowCards))),
      redCards: Math.max(0, Math.round(num(entry?.redCards, fallback?.redCards))),
      distanceCoveredKm: Math.max(0, num(entry?.distanceCoveredKm, fallback?.distanceCoveredKm)),
      sprints: Math.max(0, Math.round(num(entry?.sprints, fallback?.sprints))),
    });
  }

  const stats = (["A", "B"] as TeamId[]).map(
    (teamId) => byId.get(teamId) ?? fallbacks.find((item) => item.teamId === teamId)!
  );

  const possessionTotal = stats[0].possessionPercent + stats[1].possessionPercent;
  if (possessionTotal === 0) {
    stats[0].possessionPercent = 50;
    stats[1].possessionPercent = 50;
  } else if (Math.abs(possessionTotal - 100) > 1) {
    stats[0].possessionPercent = Math.round((stats[0].possessionPercent / possessionTotal) * 100);
    stats[1].possessionPercent = 100 - stats[0].possessionPercent;
  }

  return stats;
}

function normalizeAwards(raw: any): Award[] {
  return list(raw).map((award) => ({
    category: str(award?.category, "Award"),
    jerseyNumber: jersey(award?.jerseyNumber),
    team: str(award?.team),
    reason: str(award?.reason),
  }));
}

function normalizeReport(raw: any, teams: PlayerCount, teamStats: TeamStats[]): MatchReport {
  const teamAGoals = Math.max(0, Math.round(num(raw?.teamAGoals, teamStats[0]?.goals ?? 0)));
  const teamBGoals = Math.max(0, Math.round(num(raw?.teamBGoals, teamStats[1]?.goals ?? 0)));
  const bestXI: BestXIEntry[] = list(raw?.bestXI).map((entry) => ({
    jerseyNumber: jersey(entry?.jerseyNumber),
    team: str(entry?.team),
    position: str(entry?.position),
    reason: str(entry?.reason),
  }));

  return {
    finalScore: str(raw?.finalScore, `${teams.teamA.name} ${teamAGoals} - ${teamBGoals} ${teams.teamB.name}`),
    teamAGoals,
    teamBGoals,
    tacticalSummary: str(raw?.tacticalSummary),
    teamAStrengths: stringList(raw?.teamAStrengths),
    teamAWeaknesses: stringList(raw?.teamAWeaknesses),
    teamBStrengths: stringList(raw?.teamBStrengths),
    teamBWeaknesses: stringList(raw?.teamBWeaknesses),
    bestXI,
  };
}

function normalizePhases(raw: any): MatchPhase[] {
  return list(raw).map((phase, index) => ({
    range: str(phase?.range, `Phase ${index + 1}`),
    title: str(phase?.title, `Phase ${index + 1}`),
    description: str(phase?.description),
  }));
}

function normalizeNarratives(raw: any): SectionNarratives {
  return {
    attacking: str(raw?.attacking),
    defending: str(raw?.defending),
    passing: str(raw?.passing),
    physical: str(raw?.physical),
    goalkeeping: str(raw?.goalkeeping),
    setPieces: str(raw?.setPieces),
    refereeing: str(raw?.refereeing),
    momentum: str(raw?.momentum),
  };
}

function normalizeTurningPoints(raw: any, maxSeconds: number): TurningPoint[] {
  return list(raw).map((point) => ({
    timestamp: normalizeTimestamp(point?.timestamp, maxSeconds),
    title: str(point?.title, "Turning point"),
    description: str(point?.description),
    impact: str(point?.impact),
  }));
}

function normalizeKeyBattles(raw: any): KeyBattle[] {
  return list(raw).map((battle) => ({
    matchup: str(battle?.matchup, "Duel"),
    description: str(battle?.description),
    winner: str(battle?.winner),
  }));
}

/** Accepts either the structured shape or a plain sentence, so older output still renders. */
function normalizeImprovements(raw: any, maxSeconds: number): Improvement[] {
  return list(raw)
    .map((item) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (!trimmed) return null;
        const jerseyMatch = trimmed.match(/#\s*(\w+)/);
        const time = trimmed.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);
        return {
          area: "Coaching point",
          jerseyNumber: jerseyMatch ? jersey(jerseyMatch[1]) : "team",
          team: "",
          timestamp: time ? normalizeTimestamp(time[1], maxSeconds) : "",
          issue: trimmed,
          recommendation: "",
          drill: "",
        };
      }

      const issue = str(item?.issue);
      const recommendation = str(item?.recommendation);
      if (!issue && !recommendation) return null;

      return {
        area: str(item?.area, "Coaching point"),
        jerseyNumber: /^team$/i.test(str(item?.jerseyNumber)) ? "team" : jersey(item?.jerseyNumber),
        team: str(item?.team),
        timestamp: item?.timestamp ? normalizeTimestamp(item.timestamp, maxSeconds) : "",
        issue,
        recommendation,
        drill: str(item?.drill),
      };
    })
    .filter((item): item is Improvement => item !== null);
}

function mergeDataQuality(sources: any[], extraCaveats: string[]): DataQuality {
  const coverage = sources.map((source) => str(source?.coverage)).filter(Boolean);
  const estimatedFields = new Set<string>();
  const caveats = new Set<string>(extraCaveats);

  for (const source of sources) {
    stringList(source?.estimatedFields).forEach((field) => estimatedFields.add(field));
    stringList(source?.caveats).forEach((caveat) => caveats.add(caveat));
  }

  return {
    coverage: coverage.join(" · ") || "Estimated from the visible footage.",
    estimatedFields: Array.from(estimatedFields),
    caveats: Array.from(caveats),
  };
}

export interface RawAnalysisParts {
  scan: any;
  events: any;
  report: any;
  metadata: VideoMetadata;
  durationSeconds?: number;
  caveats?: string[];
}

export function buildSportsAnalysis(parts: RawAnalysisParts): SportsAnalysis {
  const { scan, events, report, metadata } = parts;

  const rawPlayerCount = scan?.playerCount ?? {};
  const teams: PlayerCount = {
    total: Math.max(0, Math.round(num(rawPlayerCount?.total))),
    teamA: normalizeTeamInfo(rawPlayerCount?.teamA, "A", "Team A"),
    teamB: normalizeTeamInfo(rawPlayerCount?.teamB, "B", "Team B"),
    notes: str(rawPlayerCount?.notes),
  };

  const videoInfo = normalizeVideoInfo(scan?.videoInfo, metadata);
  const maxSeconds = parts.durationSeconds || timeToSeconds(videoInfo.duration || metadata.duration);

  const players = normalizePlayers(scan?.players, teams, maxSeconds);
  if (teams.total === 0) teams.total = players.length;
  if (teams.teamA.playerCount === 0) {
    teams.teamA.playerCount = players.filter((player) => player.teamId === "A").length;
  }
  if (teams.teamB.playerCount === 0) {
    teams.teamB.playerCount = players.filter((player) => player.teamId === "B").length;
  }

  const passes = normalizePasses(events?.passes, maxSeconds);
  const shots = normalizeShots(events?.shots, maxSeconds);
  const goals = normalizeGoals(events?.goals, maxSeconds);
  const refereeDecisions = normalizeRefereeDecisions(events?.refereeDecisions, maxSeconds);

  const defensiveActions = normalizeDefensiveActions(events?.defensiveActions, maxSeconds);
  const goalkeepers = normalizeGoalkeepers(scan?.goalkeepers);

  const fallbackStats = (["A", "B"] as TeamId[]).map((teamId) =>
    derivedTeamStats(
      teamId,
      teams,
      players,
      passes,
      shots,
      goals,
      refereeDecisions,
      defensiveActions,
      goalkeepers
    )
  );
  const teamStats = normalizeTeamStats(report?.teamStats, teams, fallbackStats);

  let tactics = normalizeTactics(report?.tactics, teams);
  if (tactics.length === 0) {
    tactics = (["A", "B"] as TeamId[]).map((teamId) => ({
      teamId,
      teamName: teamId === "A" ? teams.teamA.name : teams.teamB.name,
      formation: teamId === "A" ? teams.teamA.formation : teams.teamB.formation,
      shape: "",
      teamWidthM: 0,
      defensiveLine: "",
      pressingHeight: "",
      compactness: "",
      buildUpPattern: "",
      counterAttack: "",
      wingPlay: "",
      centralAttack: "",
      transitionSpeed: "",
    }));
  }

  return {
    metadata,
    sport: str(scan?.sport, "Football (Soccer)"),
    videoInfo,
    matchSummary: {
      short: str(scan?.matchSummary?.short),
      detailed: str(scan?.matchSummary?.detailed),
      phases: normalizePhases(scan?.matchSummary?.phases),
    },
    playerCount: teams,
    players,
    ballAnalysis: normalizeBallAnalysis(scan?.ballAnalysis),
    touches: normalizeTouches(events?.touches, maxSeconds),
    passes,
    kicks: normalizeKicks(events?.kicks, maxSeconds),
    shots,
    goals,
    defensiveActions,
    goalkeepers,
    tactics,
    refereeDecisions,
    timeline: normalizeTimeline(events?.timeline, maxSeconds),
    highlights: normalizeHighlights(events?.highlights, maxSeconds),
    awards: normalizeAwards(report?.awards),
    teamStats,
    report: normalizeReport(report?.report, teams, teamStats),
    narratives: normalizeNarratives(report?.narratives),
    turningPoints: normalizeTurningPoints(report?.turningPoints, maxSeconds),
    keyBattles: normalizeKeyBattles(report?.keyBattles),
    improvements: normalizeImprovements(report?.improvements, maxSeconds),
    tacticalInsights: stringList(report?.tacticalInsights),
    dataQuality: mergeDataQuality(
      [scan?.dataQuality, events?.dataQuality, report?.dataQuality],
      parts.caveats ?? []
    ),
  };
}
