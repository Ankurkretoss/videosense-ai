"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clapperboard,
  Clock,
  Film,
  Goal as GoalIcon,
  Loader2,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { deleteAnalysis, listAnalyses, type StoredAnalysisSummary } from "@/lib/analysis-store";
import { isFirebaseConfigured } from "@/lib/firebase";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LibraryPage() {
  const configured = isFirebaseConfigured();
  const [entries, setEntries] = useState<StoredAnalysisSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!configured) return;
    let active = true;

    listAnalyses()
      .then((rows) => {
        if (!active) return;
        setEntries(rows);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load the library.");
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [configured, reloadToken]);

  const reload = () => {
    setStatus("loading");
    setError(null);
    setReloadToken((token) => token + 1);
  };

  const remove = async (id: string) => {
    setRemoving(id);
    try {
      await deleteAnalysis(id);
      setEntries((current) => current.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this analysis.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </motion.div>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">Analysis Library</h1>
              <p className="mt-2 text-gray-400">
                Every analysed match is stored automatically. Open one to read the full report again.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-white"
                onClick={reload}
                disabled={status === "loading"}
              >
                <RefreshCw className={status === "loading" ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                Refresh
              </Button>
              <Link href="/sports-analysis">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-700">
                  <Clapperboard className="h-4 w-4" />
                  New analysis
                </Button>
              </Link>
            </div>
          </div>

          {!configured && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-amber-400">Firebase is not configured</p>
                  <p className="mt-1">
                    Add your Firebase web config to{" "}
                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-amber-300">.env.local</code>{" "}
                    as <code className="rounded bg-white/10 px-1.5 py-0.5">NEXT_PUBLIC_FIREBASE_*</code>{" "}
                    values, then restart the dev server.
                  </p>
                </div>
              </div>
            </div>
          )}

          {configured && status === "loading" && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-10 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              Loading saved analyses...
            </div>
          )}

          {configured && status === "error" && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-300">
              {error}
            </div>
          )}

          {configured && status === "ready" && entries.length === 0 && (
            <EmptyState
              title="Nothing saved yet"
              description="Run a match analysis and it will appear here automatically."
            />
          )}

          {configured && status === "ready" && entries.length > 0 && (
            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.3) }}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:border-indigo-500/40"
                >
                  <Link href={`/library/${entry.id}`} className="block">
                    <div className="relative aspect-video w-full overflow-hidden bg-black/50">
                      {entry.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.thumbnail}
                          alt={entry.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-600">
                          <Film className="h-8 w-8" />
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-gray-200">
                        {entry.duration || "—"}
                      </span>
                      <span className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                        {entry.teamAGoals} – {entry.teamBGoals}
                      </span>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <Link href={`/library/${entry.id}`} className="block">
                      <h3 className="truncate font-medium text-white group-hover:text-indigo-300">
                        {entry.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                        <Film className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {entry.teamAName} vs {entry.teamBName}
                        </span>
                      </p>
                      {entry.summary && (
                        <p className="mt-2 line-clamp-3 text-sm text-gray-400">{entry.summary}</p>
                      )}
                    </Link>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
                        <Users className="h-3 w-3" />
                        {entry.playerCount}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
                        <GoalIcon className="h-3 w-3" />
                        {entry.goalCount}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
                        <Clapperboard className="h-3 w-3" />
                        {entry.highlightCount}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5">
                        {entry.eventCount} events
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(entry.createdAt)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => remove(entry.id)}
                          disabled={removing === entry.id}
                          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          aria-label="Delete analysis"
                        >
                          {removing === entry.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                        <Link
                          href={`/library/${entry.id}`}
                          className="rounded-lg p-1.5 text-indigo-400 transition-colors hover:bg-indigo-500/10"
                          aria-label="Open analysis"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
