import {
  addDoc,
  collection,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { SportsAnalysis } from "@/types/sports-analysis";

const COLLECTION = "matchAnalyses";

/** Firestore caps a document at 1 MiB; stay well clear of it. */
const MAX_JSON_BYTES = 850_000;

export type AnalysisSourceType = "file" | "youtube";

export interface StoredAnalysisSummary {
  id: string;
  title: string;
  sport: string;
  source: string;
  sourceType: AnalysisSourceType;
  createdAt: number;
  duration: string;
  resolution: string;
  fileSize: string;
  finalScore: string;
  teamAName: string;
  teamBName: string;
  teamAGoals: number;
  teamBGoals: number;
  playerCount: number;
  goalCount: number;
  highlightCount: number;
  eventCount: number;
  summary: string;
  thumbnail: string;
  trimmed: string[];
}

export interface StoredClipRef {
  key: string;
  size: number;
}

export interface StoredSourceRef {
  key: string;
  size: number;
  name: string;
}

export interface StoredAnalysis extends StoredAnalysisSummary {
  analysis: SportsAnalysis;
  /** Highlight id → clip stored in object storage. */
  clips: Record<string, StoredClipRef>;
  /** The original uploaded video, once it has finished archiving. */
  sourceVideo: StoredSourceRef | null;
}

/** Records clips that the browser uploaded to object storage. */
export async function attachStoredClips(
  id: string,
  clips: Record<string, StoredClipRef>
): Promise<void> {
  const patch: Record<string, unknown> = {};
  for (const [clipId, ref] of Object.entries(clips)) {
    patch[`clips.${clipId}`] = ref;
  }
  if (Object.keys(patch).length === 0) return;

  await updateDoc(doc(getDb(), COLLECTION, id), patch);
}

/** Records the original video once the browser has finished uploading it. */
export async function attachStoredSource(id: string, source: StoredSourceRef): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTION, id), { sourceVideo: source });
}

function eventCountOf(analysis: SportsAnalysis): number {
  return (
    analysis.touches.length +
    analysis.passes.length +
    analysis.kicks.length +
    analysis.shots.length +
    analysis.defensiveActions.length +
    analysis.refereeDecisions.length +
    analysis.timeline.length
  );
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/**
 * Serialises the analysis, shedding the bulkiest event lists only if the document
 * would not otherwise fit in Firestore. What was dropped is recorded so the UI can
 * say so instead of silently showing less than the user saw live.
 */
function serializeAnalysis(analysis: SportsAnalysis): { json: string; trimmed: string[] } {
  let payload: SportsAnalysis = analysis;
  let json = JSON.stringify(payload);
  const trimmed: string[] = [];

  const reductions: { label: string; apply: (input: SportsAnalysis) => SportsAnalysis }[] = [
    {
      label: "player movement paths",
      apply: (input) => ({
        ...input,
        players: input.players.map((player) => ({
          ...player,
          tracking: { ...player.tracking, movementPath: [] },
        })),
      }),
    },
    { label: "touch log", apply: (input) => ({ ...input, touches: [] }) },
    { label: "pass log", apply: (input) => ({ ...input, passes: [] }) },
    { label: "kick log", apply: (input) => ({ ...input, kicks: [] }) },
    {
      label: "player heatmaps",
      apply: (input) => ({
        ...input,
        players: input.players.map((player) => ({
          ...player,
          tracking: { ...player.tracking, heatmapZones: [] },
        })),
      }),
    },
  ];

  for (const reduction of reductions) {
    if (byteLength(json) <= MAX_JSON_BYTES) break;
    payload = reduction.apply(payload);
    json = JSON.stringify(payload);
    trimmed.push(reduction.label);
  }

  return { json, trimmed };
}

/** Turns Firestore's terse codes into something a user can act on. */
function describeFirestoreError(cause: unknown): Error {
  const code = (cause as { code?: string })?.code ?? "";
  const message = cause instanceof Error ? cause.message : String(cause);

  if (code === "permission-denied") {
    return new Error(
      "Firestore rules are blocking this request. Allow read/write on the matchAnalyses collection."
    );
  }
  if (code === "not-found" || /database \(default\) does not exist/i.test(message)) {
    return new Error(
      "No Firestore database exists in this Firebase project yet — create one in the Firebase console (Build → Firestore Database)."
    );
  }
  if (code === "unavailable" || code === "deadline-exceeded") {
    return new Error("Firestore is unreachable right now — check the network and try again.");
  }
  return new Error(message);
}

export interface SaveAnalysisInput {
  analysis: SportsAnalysis;
  sourceType: AnalysisSourceType;
}

export async function saveAnalysis({
  analysis,
  sourceType,
}: SaveAnalysisInput): Promise<StoredAnalysisSummary> {
  const { json, trimmed } = serializeAnalysis(analysis);
  const [teamA, teamB] = analysis.teamStats;

  const summary = {
    title: analysis.metadata.title || "Untitled match",
    sport: analysis.sport,
    source: analysis.metadata.source,
    sourceType,
    duration: analysis.videoInfo.duration || analysis.metadata.duration,
    resolution: analysis.metadata.resolution,
    fileSize: analysis.metadata.fileSize,
    finalScore: analysis.report.finalScore,
    teamAName: teamA?.teamName ?? analysis.playerCount.teamA.name,
    teamBName: teamB?.teamName ?? analysis.playerCount.teamB.name,
    teamAGoals: analysis.report.teamAGoals,
    teamBGoals: analysis.report.teamBGoals,
    playerCount: analysis.players.length,
    goalCount: analysis.goals.length,
    highlightCount: analysis.highlights.length,
    eventCount: eventCountOf(analysis),
    summary: analysis.matchSummary.short,
    thumbnail: analysis.metadata.thumbnail || "",
    trimmed,
  };

  try {
    const reference = await addDoc(collection(getDb(), COLLECTION), {
      ...summary,
      analysisJson: json,
      createdAt: serverTimestamp(),
    });
    return { id: reference.id, createdAt: Date.now(), ...summary };
  } catch (cause) {
    throw describeFirestoreError(cause);
  }
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return Date.now();
}

function toSummary(id: string, data: Record<string, unknown>): StoredAnalysisSummary {
  return {
    id,
    title: String(data.title ?? "Untitled match"),
    sport: String(data.sport ?? "Football (Soccer)"),
    source: String(data.source ?? ""),
    sourceType: data.sourceType === "youtube" ? "youtube" : "file",
    createdAt: toMillis(data.createdAt),
    duration: String(data.duration ?? ""),
    resolution: String(data.resolution ?? ""),
    fileSize: String(data.fileSize ?? ""),
    finalScore: String(data.finalScore ?? ""),
    teamAName: String(data.teamAName ?? "Team A"),
    teamBName: String(data.teamBName ?? "Team B"),
    teamAGoals: Number(data.teamAGoals ?? 0),
    teamBGoals: Number(data.teamBGoals ?? 0),
    playerCount: Number(data.playerCount ?? 0),
    goalCount: Number(data.goalCount ?? 0),
    highlightCount: Number(data.highlightCount ?? 0),
    eventCount: Number(data.eventCount ?? 0),
    summary: String(data.summary ?? ""),
    thumbnail: String(data.thumbnail ?? ""),
    trimmed: Array.isArray(data.trimmed) ? data.trimmed.map(String) : [],
  };
}

export async function listAnalyses(max = 60): Promise<StoredAnalysisSummary[]> {
  try {
    const snapshot = await getDocs(
      query(collection(getDb(), COLLECTION), orderBy("createdAt", "desc"), fsLimit(max))
    );
    return snapshot.docs.map((entry) => toSummary(entry.id, entry.data()));
  } catch (cause) {
    throw describeFirestoreError(cause);
  }
}

export async function getStoredAnalysis(id: string): Promise<StoredAnalysis | null> {
  try {
    const snapshot = await getDoc(doc(getDb(), COLLECTION, id));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    const analysis = JSON.parse(String(data.analysisJson ?? "{}")) as SportsAnalysis;
    const clips = (data.clips ?? {}) as Record<string, StoredClipRef>;
    const sourceVideo = (data.sourceVideo ?? null) as StoredSourceRef | null;

    return { ...toSummary(snapshot.id, data), analysis, clips, sourceVideo };
  } catch (cause) {
    throw describeFirestoreError(cause);
  }
}

export async function deleteAnalysis(id: string): Promise<void> {
  try {
    await deleteDoc(doc(getDb(), COLLECTION, id));
  } catch (cause) {
    throw describeFirestoreError(cause);
  }
}
