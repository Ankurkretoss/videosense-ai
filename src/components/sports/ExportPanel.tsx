"use client";

import { useState } from "react";
import { Download, FileArchive, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "./report-ui";
import {
  analysisBundleName,
  buildAnalysisZip,
  eventsCsv,
  matchReportMarkdown,
  playersCsv,
} from "@/lib/sports-export";
import { downloadBlob, extractClips, slugifyFilename, type ClipWindow } from "@/lib/clip";
import { timeToSeconds } from "@/lib/time";
import type { SportsAnalysis } from "@/types/sports-analysis";

interface ExportPanelProps {
  analysis: SportsAnalysis;
  sourceFile: File | null;
}

export function ExportPanel({ analysis, sourceFile }: ExportPanelProps) {
  const [includeClips, setIncludeClips] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const baseName = analysisBundleName(analysis);

  const downloadText = (content: string, filename: string, type: string) =>
    downloadBlob(new Blob([content], { type }), filename);

  const downloadBundle = async () => {
    setBusy(true);
    setError(null);
    try {
      let clips: { filename: string; blob: Blob }[] = [];

      if (includeClips && sourceFile && analysis.highlights.length > 0) {
        const windows: ClipWindow[] = analysis.highlights.map((highlight) => ({
          id: highlight.id,
          label: `${highlight.startTimestamp.replace(/:/g, "-")}-${slugifyFilename(highlight.title)}`,
          startSeconds: timeToSeconds(highlight.startTimestamp),
          endSeconds: timeToSeconds(highlight.endTimestamp),
        }));

        const generated = await extractClips(sourceFile, windows, {
          onClipDone: (done, total, label) => setStatus(`Cutting clip ${done}/${total} — ${label}`),
        });
        clips = generated.map((clip) => ({ filename: clip.filename, blob: clip.blob }));
      }

      setStatus("Packing the archive...");
      const zip = await buildAnalysisZip(analysis, clips);
      downloadBlob(zip, `${baseName}.zip`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  };

  return (
    <SectionCard
      title="Export"
      icon={<Download className="h-5 w-5 text-indigo-400" />}
      description="Take the full report, the raw data or the cut clips with you."
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="outline"
          className="justify-start border-white/10 bg-white/5 text-white"
          onClick={() => downloadText(matchReportMarkdown(analysis), `${baseName}.md`, "text/markdown")}
        >
          <FileText className="h-4 w-4" />
          Match report (Markdown)
        </Button>
        <Button
          variant="outline"
          className="justify-start border-white/10 bg-white/5 text-white"
          onClick={() =>
            downloadText(JSON.stringify(analysis, null, 2), `${baseName}.json`, "application/json")
          }
        >
          <FileJson className="h-4 w-4" />
          Tracking data (JSON)
        </Button>
        <Button
          variant="outline"
          className="justify-start border-white/10 bg-white/5 text-white"
          onClick={() => downloadText(eventsCsv(analysis), `${baseName}-events.csv`, "text/csv")}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Events (CSV)
        </Button>
        <Button
          variant="outline"
          className="justify-start border-white/10 bg-white/5 text-white"
          onClick={() => downloadText(playersCsv(analysis), `${baseName}-players.csv`, "text/csv")}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Player stats (CSV)
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">Everything in one ZIP</p>
            <p className="text-xs text-gray-500">
              Report, JSON, every CSV{includeClips ? " and all highlight clips" : ""}.
            </p>
          </div>
          <Button
            className="bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={downloadBundle}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
            Download ZIP
          </Button>
        </div>

        {sourceFile && analysis.highlights.length > 0 && (
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={includeClips}
              onChange={(event) => setIncludeClips(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-indigo-500"
            />
            Include all {analysis.highlights.length} highlight clips (slower — each one is re-encoded
            in your browser)
          </label>
        )}

        {busy && status && (
          <p className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            {status}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    </SectionCard>
  );
}
