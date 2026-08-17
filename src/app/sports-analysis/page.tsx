"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Clapperboard,
  Map,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UploadCard, VideoPreview } from "@/components/UploadCard";
import { YouTubeInput } from "@/components/YouTubeInput";
import { ProgressCard } from "@/components/ProgressCard";
import { VideoOverview } from "@/components/VideoOverview";
import { EmptyState } from "@/components/EmptyState";
import { MatchSummaryCard } from "@/components/sports/MatchSummaryCard";
import { MatchFilmPanel } from "@/components/sports/MatchVideoPlayer";
import { VideoInfoCard } from "@/components/sports/VideoInfoCard";
import { TeamComparison } from "@/components/sports/TeamComparison";
import { MatchTimeline } from "@/components/sports/MatchTimeline";
import { GoalsList } from "@/components/sports/GoalsList";
import { PlayerRoster } from "@/components/sports/PlayerRoster";
import { AwardsPanel } from "@/components/sports/AwardsPanel";
import { EventTables } from "@/components/sports/EventTables";
import { TacticsPanel } from "@/components/sports/TacticsPanel";
import { PitchMaps } from "@/components/sports/PitchMaps";
import { MatchReportPanel } from "@/components/sports/MatchReportPanel";
import { HighlightClips } from "@/components/sports/HighlightClips";
import { ImprovementList } from "@/components/sports/ImprovementList";
import { NarrativePanel } from "@/components/sports/NarrativePanel";
// import { ExportPanel } from "@/components/sports/ExportPanel";
import { useUpload } from "@/hooks/useUpload";
import { useSportsAnalysis } from "@/hooks/useSportsAnalysis";
import { youtubeVideoId } from "@/lib/video-meta";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "players", label: "Players", icon: Users },
  { id: "events", label: "Events", icon: Activity },
  { id: "tactics", label: "Tactics & report", icon: Target },
  { id: "maps", label: "Pitch maps", icon: Map },
  { id: "clips", label: "Clips", icon: Clapperboard },
  // Export is temporarily hidden — re-add together with the <ExportPanel /> block below.
  // { id: "export", label: "Export", icon: Download },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SportsAnalysisPage() {
  const upload = useUpload();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [embedSeek, setEmbedSeek] = useState({ seconds: 0, nonce: 0 });
  const analysis = useSportsAnalysis(apiKey);

  useEffect(() => {
    const initConfig = async () => {
      try {
        const response = await fetch("/api/config");
        const data = await response.json();

        if (data.configured && data.apiKey) {
          setApiKey(data.apiKey);
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Failed to load configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initConfig();
  }, []);

  const handleAnalyze = () => {
    if (upload.file) {
      analysis.analyze(upload.file, "");
    } else if (upload.youtubeUrl) {
      analysis.analyze(null, upload.youtubeUrl);
    }
  };

  const youtubeId = upload.youtubeUrl ? youtubeVideoId(upload.youtubeUrl) : null;

  const handleSeek = useCallback(
    (seconds: number) => {
      const target = Math.max(0, seconds);
      const video = videoRef.current;

      if (video) {
        video.currentTime = target;
        void video.play().catch(() => {});
        video.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      if (youtubeId) {
        setEmbedSeek((current) => ({ seconds: target, nonce: current.nonce + 1 }));
      }
    },
    [youtubeId]
  );

  const result = analysis.result;
  const showResults = analysis.status === "completed" && result !== null;
  const hasFilm = Boolean((upload.file && upload.preview) || youtubeId);
  const seek = hasFilm ? handleSeek : undefined;

  const teamAName = result?.playerCount.teamA.name ?? "Team A";
  const teamBName = result?.playerCount.teamB.name ?? "Team B";

  const tabCounts = useMemo<Partial<Record<TabId, number>>>(
    () =>
      result
        ? {
            players: result.players.length,
            events:
              result.shots.length +
              result.passes.length +
              result.kicks.length +
              result.touches.length +
              result.defensiveActions.length +
              result.refereeDecisions.length,
            clips: result.highlights.length,
          }
        : {},
    [result]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div
          className={cn(
            "mx-auto w-full px-4 py-8 sm:px-6 lg:px-8",
            showResults ? "max-w-[1800px]" : "max-w-5xl"
          )}
        >
          {!showResults && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h1 className="text-3xl font-bold text-white">Deep Football Match Analysis</h1>
                <p className="mt-2 text-gray-400">
                  Upload match footage or paste a YouTube URL. Every player is detected and tracked,
                  every touch, pass, kick, shot, goal and referee decision is logged, and each moment
                  can be cut into its own clip.
                </p>
              </motion.div>
            </>
          )}

          {showResults && result ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-white">Match Report</h1>
                  <p className="mt-2 text-gray-400">
                    {result.report.finalScore} · {result.players.length} players tracked ·{" "}
                    {result.highlights.length} clip-ready moments
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white"
                  onClick={() => {
                    analysis.reset();
                    upload.clearUpload();
                    setTab("overview");
                  }}
                >
                  New Analysis
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200/80"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  Jersey numbers, tracking distances, speeds, angles, xG and ratings are AI estimates
                  read from the footage — treat them as scouting indications, not officially measured
                  data.
                </span>
              </motion.div>

              <div
                className={cn(
                  "grid gap-6",
                  hasFilm && "xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_460px]"
                )}
              >
                <div className="order-2 min-w-0 space-y-6 xl:order-1">
                  <div className="sticky top-16 z-10 -mx-1 overflow-x-auto bg-gradient-to-b from-black/85 to-black/40 px-1 py-2 backdrop-blur">
                    <div className="flex gap-1.5">
                      {TABS.map((item) => {
                        const Icon = item.icon;
                        const count = tabCounts[item.id];
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={cn(
                              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                              tab === item.id
                                ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300"
                                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {item.label}
                            {count !== undefined && count > 0 && (
                              <span className="text-xs text-gray-500">{count}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {tab === "overview" && (
                    <div className="space-y-6">
                      <VideoOverview metadata={result.metadata} />
                      <MatchSummaryCard
                        sport={result.sport}
                        matchSummary={result.matchSummary}
                        playerCount={result.playerCount}
                      />
                      <TeamComparison teamStats={result.teamStats} report={result.report} />
                      <VideoInfoCard
                        videoInfo={result.videoInfo}
                        ballAnalysis={result.ballAnalysis}
                      />
                      <GoalsList goals={result.goals} teamAName={teamAName} onSeek={seek} />
                      <MatchTimeline timeline={result.timeline} onSeek={seek} />
                    </div>
                  )}

                  {tab === "players" && (
                    <div className="space-y-6">
                      <AwardsPanel awards={result.awards} teamAName={teamAName} />
                      <PlayerRoster
                        players={result.players}
                        teamAName={teamAName}
                        teamBName={teamBName}
                      />
                    </div>
                  )}

                  {tab === "events" && (
                    <div className="space-y-6">
                      <EventTables analysis={result} />
                      <GoalsList goals={result.goals} teamAName={teamAName} onSeek={seek} />
                    </div>
                  )}

                  {tab === "tactics" && (
                    <div className="space-y-6">
                      <TacticsPanel
                        tactics={result.tactics}
                        goalkeepers={result.goalkeepers}
                        teamAName={teamAName}
                      />
                      <NarrativePanel
                        narratives={result.narratives}
                        turningPoints={result.turningPoints}
                        keyBattles={result.keyBattles}
                        onSeek={seek}
                      />
                      <ImprovementList
                        improvements={result.improvements}
                        tacticalInsights={result.tacticalInsights}
                        onSeek={seek}
                      />
                      <MatchReportPanel
                        report={result.report}
                        dataQuality={result.dataQuality}
                        teamAName={teamAName}
                        teamBName={teamBName}
                      />
                    </div>
                  )}

                  {tab === "maps" && <PitchMaps analysis={result} />}

                  {tab === "clips" && (
                    <HighlightClips
                      highlights={result.highlights}
                      sourceFile={upload.file}
                      youtubeUrl={upload.youtubeUrl || null}
                      onSeek={seek}
                    />
                  )}

                  {/* {tab === "export" && <ExportPanel analysis={result} sourceFile={upload.file} />} */}
                </div>

                {hasFilm && (
                  <MatchFilmPanel
                    title={upload.file?.name ?? result.metadata.title}
                    teamStats={result.teamStats}
                    report={result.report}
                    fileSrc={upload.file ? upload.preview : null}
                    youtubeId={upload.file ? null : youtubeId}
                    videoRef={videoRef}
                    seekSeconds={embedSeek.seconds}
                    seekNonce={embedSeek.nonce}
                    goals={result.goals}
                    highlights={result.highlights}
                    onSeek={handleSeek}
                  />
                )}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    <span className="text-gray-400">Checking configuration...</span>
                  </div>
                </motion.div>
              ) : !isConnected ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-6"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-amber-400" />
                    <div>
                      <h3 className="font-medium text-amber-400">
                        Gemini API Key Not Configured
                      </h3>
                      <p className="mt-1 text-sm text-gray-400">
                        Add your Gemini API key to{" "}
                        <code className="rounded bg-white/10 px-1.5 py-0.5 text-amber-400">
                          .env.local
                        </code>
                        :
                      </p>
                      <pre className="mt-2 rounded-lg bg-black/50 p-3 text-sm text-gray-300">
                        GEMINI_API_KEY=your_key_here
                      </pre>
                      <p className="mt-2 text-sm text-gray-400">
                        Get a free key at{" "}
                        <a
                          href="https://aistudio.google.com/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:underline"
                        >
                          aistudio.google.com/apikey
                        </a>
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <UploadCard
                        onFileSelect={upload.setFile}
                        hasUpload={upload.hasUpload}
                        onClear={upload.clearUpload}
                      />

                      {upload.file && upload.preview && (
                        <VideoPreview file={upload.file} preview={upload.preview} />
                      )}
                    </div>

                    <YouTubeInput
                      onUrlSubmit={upload.setYoutubeUrl}
                      hasUpload={upload.hasUpload}
                    />
                  </div>

                  {upload.error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400"
                    >
                      {upload.error}
                    </motion.div>
                  )}

                  {analysis.isAnalyzing && (
                    <div className="space-y-3">
                      <ProgressCard progress={analysis.progress} />
                      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-500">
                        <span>
                          A deep analysis runs three passes over the footage — detection and
                          tracking, event logging, then tactics and the report. Long clips take a
                          few minutes.
                        </span>
                        <button
                          type="button"
                          onClick={analysis.cancel}
                          className="ml-4 shrink-0 text-gray-400 transition-colors hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {analysis.error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400"
                    >
                      {analysis.error}
                    </motion.div>
                  )}

                  <Button
                    size="lg"
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                    onClick={handleAnalyze}
                    disabled={!upload.hasUpload || analysis.isAnalyzing}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run deep match analysis
                  </Button>

                  {!upload.hasUpload && !analysis.isAnalyzing && (
                    <EmptyState
                      title="No footage selected"
                      description="Upload match footage or paste a YouTube URL to get started."
                    />
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
