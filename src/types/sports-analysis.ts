import type { VideoMetadata } from "@/types/analysis";

export type TeamId = "A" | "B";

/** 1. VIDEO INFORMATION */
export interface VideoInfo {
  duration: string;
  fps: string;
  resolution: string;
  cameraType: string;
  cameraMovement: string;
  weather: string;
  timeOfDay: string;
  stadium: string;
  pitchDimensions: string;
  videoQualityScore: number;
  visibilityScore: number;
  notes: string;
}

export interface TeamInfo {
  id: TeamId;
  name: string;
  shirtColor: string;
  shortsColor: string;
  playerCount: number;
  formation: string;
}

export interface PlayerCount {
  total: number;
  teamA: TeamInfo;
  teamB: TeamInfo;
  notes: string;
}

/** Normalized pitch coordinates: x 0-100 (left→right goal), y 0-100 (top→bottom touchline). */
export interface PitchPoint {
  x: number;
  y: number;
}

export interface HeatmapZone extends PitchPoint {
  intensity: number;
}

export interface PathPoint extends PitchPoint {
  timestamp: string;
}

/** 3. PLAYER TRACKING */
export interface PlayerTracking {
  distanceCoveredM: number;
  topSpeedKmh: number;
  avgSpeedKmh: number;
  sprintCount: number;
  possessionTimeSec: number;
  timeOnScreenSec: number;
  walkingTimeSec: number;
  standingTimeSec: number;
  heatmapZones: HeatmapZone[];
  movementPath: PathPoint[];
}

export interface PlayerStats {
  touches: number;
  passesAttempted: number;
  passesCompleted: number;
  passAccuracy: number;
  shots: number;
  shotsOnTarget: number;
  goals: number;
  assists: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  duelsWon: number;
  foulsCommitted: number;
  foulsWon: number;
}

/** Written scouting detail that sits alongside a player's numbers. */
export interface PlayerScouting {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  coachingNote: string;
  standoutMoments: string[];
}

/** 13. PLAYER PERFORMANCE RATING (all values 0-10) */
export interface PlayerRatings {
  attack: number;
  passing: number;
  defending: number;
  positioning: number;
  movement: number;
  vision: number;
  decisionMaking: number;
  ballControl: number;
  workRate: number;
  overall: number;
  justification: string;
}

/** 2. PLAYER DETECTION */
export interface SportsPlayer {
  id: string;
  jerseyNumber: string;
  team: string;
  teamId: TeamId;
  role: "goalkeeper" | "outfield";
  position: string;
  jerseyColor: string;
  shortsColor: string;
  socksColor: string;
  isCaptain: boolean;
  isGoalkeeper: boolean;
  estimatedHeight: string;
  footPreference: string;
  confidence: number;
  notes: string;
  tracking: PlayerTracking;
  stats: PlayerStats;
  ratings: PlayerRatings;
  scouting: PlayerScouting;
}

/** 4. BALL TRACKING */
export interface BallAnalysis {
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  maxHeightM: number;
  longestPassM: number;
  longestShotM: number;
  bounceCount: number;
  airTimeSec: number;
  groundContacts: number;
  trajectoryNotes: string;
}

/** 5. EVERY TOUCH ANALYSIS */
export interface TouchEvent {
  timestamp: string;
  jerseyNumber: string;
  team: string;
  touchType: string;
  firstTouchQuality: string;
  direction: string;
  pressure: string;
  distanceAfterM: number;
  notes: string;
}

/** 6. PASS ANALYSIS */
export interface PassEvent {
  timestamp: string;
  passerJerseyNumber: string;
  receiverJerseyNumber: string | null;
  team: string;
  distanceM: number;
  passHeight: string;
  speedKmh: number;
  direction: string;
  angleDeg: number;
  accuracyScore: number;
  successful: boolean;
  progressive: boolean;
  throughBall: boolean;
  cross: boolean;
  longBall: boolean;
  backPass: boolean;
  start: PitchPoint;
  end: PitchPoint;
}

/** 7. KICK ANALYSIS */
export interface KickEvent {
  timestamp: string;
  jerseyNumber: string;
  team: string;
  kickType: string;
  foot: string;
  contactPoint: string;
  ballSpeedKmh: number;
  launchSpeedKmh: number;
  launchAngleDeg: number;
  groundAngleDeg: number;
  elevationAngleDeg: number;
  directionDeg: number;
  powerPercent: number;
  estimatedForceN: number;
  followThrough: string;
  accuracyScore: number;
}

export type ShotOutcome = "goal" | "saved" | "blocked" | "off-target" | "post" | "deflected";

/** 8. SHOT ANALYSIS */
export interface ShotEvent {
  timestamp: string;
  shooterJerseyNumber: string;
  team: string;
  shotType: string;
  description: string;
  assistJerseyNumber: string | null;
  distanceM: number;
  speedKmh: number;
  angleDeg: number;
  xG: number;
  onTarget: boolean;
  outcome: ShotOutcome;
  blocked: boolean;
  deflection: boolean;
  location: PitchPoint;
}

/** 9. GOAL ANALYSIS */
export interface GoalEvent {
  timestamp: string;
  scorerJerseyNumber: string;
  scorerTeam: string;
  assistJerseyNumber: string | null;
  kickType: string;
  kickAngle: string;
  description: string;
  buildUp: string;
  passSequence: string[];
  defensiveErrors: string[];
  goalkeeperPosition: string;
  goalProbability: number;
  celebrationTimestamp: string | null;
}

export type DefensiveActionType =
  | "tackle"
  | "interception"
  | "block"
  | "clearance"
  | "pressure"
  | "duel"
  | "error";

/** 10. DEFENSIVE ANALYSIS */
export interface DefensiveAction {
  timestamp: string;
  jerseyNumber: string;
  team: string;
  actionType: DefensiveActionType;
  successful: boolean;
  description: string;
}

/** 11. GOALKEEPER ANALYSIS */
export interface GoalkeeperAnalysis {
  jerseyNumber: string;
  team: string;
  saves: number;
  goalsConceded: number;
  saveDifficulty: string;
  reflexTimeSec: number;
  distributionAccuracy: number;
  catchSuccess: number;
  punches: number;
  errors: string[];
  positioning: string;
  notes: string;
}

/** 12. TACTICAL ANALYSIS */
export interface TeamTactics {
  teamId: TeamId;
  teamName: string;
  formation: string;
  shape: string;
  teamWidthM: number;
  defensiveLine: string;
  pressingHeight: string;
  compactness: string;
  buildUpPattern: string;
  counterAttack: string;
  wingPlay: string;
  centralAttack: string;
  transitionSpeed: string;
}

export type RefereeDecisionType =
  | "foul"
  | "yellow-card"
  | "red-card"
  | "handball"
  | "offside"
  | "advantage"
  | "free-kick"
  | "penalty";

/** 14. REFEREE ANALYSIS */
export interface RefereeDecision {
  timestamp: string;
  type: RefereeDecisionType;
  jerseyNumber: string;
  team: string;
  description: string;
}

/** 15. EVENT TIMELINE */
export interface MatchTimelineEvent {
  timestamp: string;
  type: string;
  title: string;
  description: string;
  team: string;
  jerseyNumber: string | null;
}

export type HighlightType =
  | "goal"
  | "shot-on-target"
  | "shot-off-target"
  | "key-pass"
  | "long-pass"
  | "cross"
  | "save"
  | "foul"
  | "card"
  | "skill"
  | "dribble"
  | "tackle"
  | "interception"
  | "corner"
  | "free-kick"
  | "penalty"
  | "celebration"
  | "fast-break"
  | "mistake"
  | "other";

/** 16/17. AUTO VIDEO CLIPS + PLAYER-WISE HIGHLIGHTS */
export interface Highlight {
  id: string;
  type: HighlightType;
  startTimestamp: string;
  endTimestamp: string;
  title: string;
  description: string;
  playersInvolved: string[];
  team: string;
  importance: number;
}

/** 13. Awards */
export interface Award {
  category: string;
  jerseyNumber: string;
  team: string;
  reason: string;
}

/** 20. FINAL MATCH REPORT — per team */
export interface TeamStats {
  teamId: TeamId;
  teamName: string;
  goals: number;
  possessionPercent: number;
  shots: number;
  shotsOnTarget: number;
  bigChances: number;
  xG: number;
  passesAttempted: number;
  passesCompleted: number;
  passAccuracy: number;
  crosses: number;
  throughBalls: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  saves: number;
  duelsWon: number;
  fouls: number;
  corners: number;
  offsides: number;
  yellowCards: number;
  redCards: number;
  distanceCoveredKm: number;
  sprints: number;
}

export interface BestXIEntry {
  jerseyNumber: string;
  team: string;
  position: string;
  reason: string;
}

export interface MatchReport {
  finalScore: string;
  teamAGoals: number;
  teamBGoals: number;
  tacticalSummary: string;
  teamAStrengths: string[];
  teamAWeaknesses: string[];
  teamBStrengths: string[];
  teamBWeaknesses: string[];
  bestXI: BestXIEntry[];
}

export interface DataQuality {
  coverage: string;
  estimatedFields: string[];
  caveats: string[];
}

/** A phase of play, so the summary reads as a story rather than one paragraph. */
export interface MatchPhase {
  range: string;
  title: string;
  description: string;
}

export interface TurningPoint {
  timestamp: string;
  title: string;
  description: string;
  impact: string;
}

export interface KeyBattle {
  matchup: string;
  description: string;
  winner: string;
}

/** Written analysis per theme — the prose that goes with the numbers. */
export interface SectionNarratives {
  attacking: string;
  defending: string;
  passing: string;
  physical: string;
  goalkeeping: string;
  setPieces: string;
  refereeing: string;
  momentum: string;
}

export interface Improvement {
  area: string;
  jerseyNumber: string;
  team: string;
  timestamp: string;
  issue: string;
  recommendation: string;
  drill: string;
}

export interface SportsAnalysis {
  metadata: VideoMetadata;
  sport: string;
  videoInfo: VideoInfo;
  matchSummary: {
    short: string;
    detailed: string;
    phases: MatchPhase[];
  };
  playerCount: PlayerCount;
  players: SportsPlayer[];
  ballAnalysis: BallAnalysis;
  touches: TouchEvent[];
  passes: PassEvent[];
  kicks: KickEvent[];
  shots: ShotEvent[];
  goals: GoalEvent[];
  defensiveActions: DefensiveAction[];
  goalkeepers: GoalkeeperAnalysis[];
  tactics: TeamTactics[];
  refereeDecisions: RefereeDecision[];
  timeline: MatchTimelineEvent[];
  highlights: Highlight[];
  awards: Award[];
  teamStats: TeamStats[];
  report: MatchReport;
  narratives: SectionNarratives;
  turningPoints: TurningPoint[];
  keyBattles: KeyBattle[];
  improvements: Improvement[];
  tacticalInsights: string[];
  dataQuality: DataQuality;
}
