"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Clock, Database, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MatchReportView } from "@/components/sports/MatchReportView";
import { getStoredAnalysis, type StoredAnalysis } from "@/lib/analysis-store";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function StoredAnalysisPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [entry, setEntry] = useState<StoredAnalysis | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      if (!isFirebaseConfigured()) {
        setError("Firebase is not configured on this deployment.");
        setStatus("error");
        return;
      }

      try {
        const stored = await getStoredAnalysis(id);
        if (!stored) {
          setStatus("missing");
          return;
        }
        setEntry(stored);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load this analysis.");
        setStatus("error");
      }
    })();
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to library
            </Link>
          </div>

          {status === "loading" && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-10 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              Loading the saved report...
            </div>
          )}

          {status === "missing" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              <p className="text-white">This analysis is no longer in the library.</p>
              <Link href="/library" className="mt-4 inline-block">
                <Button variant="outline" className="border-white/10 bg-white/5 text-white">
                  Back to library
                </Button>
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              {error}
            </div>
          )}

          {status === "ready" && entry && (
            <MatchReportView
              analysis={entry.analysis}
              youtubeUrl={entry.sourceType === "youtube" ? entry.source : null}
              headerTitle={entry.title}
              headerActions={
                <Link href="/sports-analysis">
                  <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                    New analysis
                  </Button>
                </Link>
              }
              headerNote={
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-indigo-400" />
                    Saved report
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                  <span className="truncate">{entry.source}</span>
                  {entry.trimmed.length > 0 && (
                    <span className="text-amber-300">
                      Not stored to keep the record small: {entry.trimmed.join(", ")}
                    </span>
                  )}
                  {entry.sourceType === "file" && (
                    <span className="ml-auto">
                      Clip cutting needs the original file — re-upload it to cut clips again.
                    </span>
                  )}
                </div>
              }
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
