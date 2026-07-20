"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UploadCard, VideoPreview } from "@/components/UploadCard";
import { YouTubeInput } from "@/components/YouTubeInput";
import { ProgressCard } from "@/components/ProgressCard";
import { VideoOverview } from "@/components/VideoOverview";
import { SummaryCard } from "@/components/SummaryCard";
import { Timeline } from "@/components/Timeline";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { SceneGrid } from "@/components/SceneGrid";
import { TopicCloud } from "@/components/TopicCloud";
import { KeywordCloud } from "@/components/KeywordCloud";
import { ActionItems } from "@/components/ActionItems";
import { InsightCard } from "@/components/InsightCard";
import { EmptyState } from "@/components/EmptyState";
import { useUpload } from "@/hooks/useUpload";
import { useAnalysis } from "@/hooks/useAnalysis";
import { initializeGeminiProvider } from "@/lib/ai";

export default function AnalyzePage() {
  const upload = useUpload();
  const analysis = useAnalysis();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initProvider = async () => {
      try {
        const response = await fetch("/api/config");
        const data = await response.json();

        if (data.configured && data.apiKey) {
          await initializeGeminiProvider(data.apiKey);
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Failed to initialize provider:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initProvider();
  }, []);

  const handleAnalyze = () => {
    if (upload.file) {
      analysis.analyze(upload.file, "");
    } else if (upload.youtubeUrl) {
      analysis.analyze(null, upload.youtubeUrl);
    }
  };

  const showResults =
    analysis.status === "completed" && analysis.result !== null;
  const result = analysis.result;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {!showResults && (
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
          )}

          {!showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-white">Analyze Video</h1>
              <p className="mt-2 text-gray-400">
                Upload a video file or paste a YouTube URL to get started.
              </p>
            </motion.div>
          )}

          {showResults ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Analysis Report
                  </h1>
                  <p className="mt-2 text-gray-400">
                    Complete video analysis powered by AI.
                  </p>
                </div>
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
              </div>

              {result && (
                <>
                  <VideoOverview metadata={result.metadata} />
                  <SummaryCard summary={result.summary} />
                  <Timeline entries={result.timeline} />
                  <TranscriptViewer entries={result.transcript} />
                  <SceneGrid scenes={result.scenes} />
                  <TopicCloud topics={result.topics} />
                  <KeywordCloud keywords={result.keywords} />
                  <ActionItems items={result.actionItems} />
                  <InsightCard insights={result.insights} />
                </>
              )}
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
                    <span className="text-gray-400">
                      Checking configuration...
                    </span>
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
                        <VideoPreview
                          file={upload.file}
                          preview={upload.preview}
                        />
                      )}

                      {upload.file && !upload.preview && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="rounded-xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-indigo-500/10 p-2">
                              <Sparkles className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {upload.file.name}
                              </p>
                              <p className="text-sm text-gray-400">
                                {(upload.file.size / (1024 * 1024)).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                          </div>
                        </motion.div>
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
                    <ProgressCard progress={analysis.progress} />
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
                    Analyze Video
                  </Button>

                  {!upload.hasUpload && !analysis.isAnalyzing && (
                    <EmptyState
                      title="No video selected"
                      description="Upload a video or paste a YouTube URL to get started."
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
