"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UploadCard, VideoPreview } from "@/components/UploadCard";
import { YouTubeInput } from "@/components/YouTubeInput";
import { ProgressCard } from "@/components/ProgressCard";
import { EmptyState } from "@/components/EmptyState";
import { MatchReportView } from "@/components/sports/MatchReportView";
import { ArchiveBanner } from "@/components/sports/ArchiveBanner";
// import { ExportPanel } from "@/components/sports/ExportPanel";
import { useUpload } from "@/hooks/useUpload";
import { useSportsAnalysis } from "@/hooks/useSportsAnalysis";
import { useHighlightClips } from "@/hooks/useHighlightClips";
import { useAnalysisArchive } from "@/hooks/useAnalysisArchive";
import type { Highlight } from "@/types/sports-analysis";
import { cn } from "@/lib/utils";

const EMPTY_HIGHLIGHTS: Highlight[] = [];

export default function SportsAnalysisPage() {
  const upload = useUpload();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const analysis = useSportsAnalysis(apiKey);

  // Clip cutting is owned here, not by the Clips tab, so it starts the moment the
  // report is ready and keeps running while the user reads any other tab.
  const clipState = useHighlightClips(
    analysis.result?.highlights ?? EMPTY_HIGHLIGHTS,
    analysis.status === "completed" ? upload.file : null
  );

  // Every finished report is archived in Firestore straight away.
  const archive = useAnalysisArchive(
    analysis.status === "completed" ? analysis.result : null,
    upload.file ? "file" : "youtube"
  );

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

  const result = analysis.result;
  const showResults = analysis.status === "completed" && result !== null;
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
            <MatchReportView
              analysis={result}
              sourceFile={upload.file}
              filePreview={upload.preview}
              youtubeUrl={upload.youtubeUrl || null}
              clipState={clipState}
              headerNote={<ArchiveBanner archive={archive} />}
              headerActions={
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 text-white"
                  onClick={() => {
                    analysis.reset();
                    upload.clearUpload();
                  }}
                >
                  New Analysis
                </Button>
              }
            />
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
