"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Panel } from "@/components/vantage/ui";
import type { SportsProgressDetail } from "@/lib/ai";
import { cn } from "@/lib/utils";

/**
 * The "Analyzing…" screen from the VantageAI design: a tracked pitch preview with
 * a frame counter and live counts on the left, and the pipeline on the right.
 */

const PIPELINE = [
  "Uploading footage",
  "Detecting players",
  "Tracking movement",
  "Detecting events",
  "Identifying key moments",
  "Generating tactical analysis",
  "Creating highlight clips",
  "Building final report",
];

const MARKERS = [
  { num: "17", x: 30, y: 58, dur: 5.5, team: "A" },
  { num: "8", x: 46, y: 40, dur: 6.4, team: "A" },
  { num: "11", x: 62, y: 66, dur: 7.1, team: "A" },
  { num: "4", x: 71, y: 34, dur: 6.8, team: "B" },
  { num: "6", x: 55, y: 74, dur: 5.9, team: "B" },
  { num: "2", x: 80, y: 55, dur: 7.6, team: "B" },
];

interface ProcessingScreenProps {
  title: string;
  durationLabel: string;
  percent: number;
  message: string;
  detail: SportsProgressDetail;
  /** Assumed frame rate, only used for the frame counter chip. */
  fps?: number;
  durationSeconds?: number;
  onCancel: () => void;
}

export function ProcessingScreen({
  title,
  durationLabel,
  percent,
  message,
  detail,
  fps = 25,
  durationSeconds = 0,
  onCancel,
}: ProcessingScreenProps) {
  const activeIndex = Math.min(
    PIPELINE.length - 1,
    Math.floor((percent / 100) * PIPELINE.length)
  );

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedLabel = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  const totalFrames = durationSeconds > 0 ? Math.round(durationSeconds * fps) : 0;
  const currentFrame = Math.round((totalFrames * percent) / 100);
  const remaining =
    percent > 4 ? Math.max(1, Math.round(((100 - percent) / percent) * 1.2)) : null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <h1 className="text-[26px] font-extrabold tracking-[-0.03em]">Analyzing {title}</h1>
          <p className="font-mono-num mt-1.5 text-[13.5px] text-mute">
            Football · deep analysis{durationLabel ? ` · ${durationLabel} footage` : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="font-mono-num text-[34px] leading-none font-semibold">
            {Math.round(percent)}%
          </div>
          <div className="font-mono-num mt-1.5 text-[12.5px] text-mute-3">
            {elapsedLabel} elapsed{remaining ? ` · ~${remaining} min left` : ""}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          <div
            className="relative aspect-video"
            style={{
              background: "repeating-linear-gradient(115deg, #14251A 0 14px, #101F16 14px 28px)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(520px_320px_at_45%_35%,rgba(139,107,255,0.22),transparent_70%)]" />

            {totalFrames > 0 && (
              <div className="font-mono-num absolute top-3 left-3 rounded-lg border border-white/[0.11] bg-ink/[0.78] px-2.5 py-1.5 text-[11px] text-ink-300">
                FRAME {currentFrame.toLocaleString()} / {totalFrames.toLocaleString()}
              </div>
            )}

            {MARKERS.map((marker) => (
              <div
                key={marker.num}
                className="absolute flex items-center gap-1"
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                  animation: `vtrack ${marker.dur}s ease-in-out infinite`,
                }}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border-2"
                  style={{
                    borderColor: marker.team === "A" ? "#6B49FF" : "#F87171",
                  }}
                />
                <span
                  className="font-mono-num rounded px-1.5 py-px text-[10px] font-semibold text-white"
                  style={{
                    background:
                      marker.team === "A" ? "rgba(107,73,255,0.9)" : "rgba(248,113,113,0.9)",
                  }}
                >
                  {marker.num}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4">
            <div
              className={cn(
                "text-[14px] font-bold",
                /busy|retry|retrying/i.test(message) ? "text-warn" : "text-ink-100"
              )}
            >
              {message || "Working through the footage…"}
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6B49FF] to-[#A78BFA] transition-[width] duration-500"
                style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { k: "Players detected", v: detail.players ?? "—" },
                { k: "Events so far", v: detail.events ?? "—" },
                { k: "Clips queued", v: detail.clips ?? "—" },
                { k: "Passes", v: `${activeIndex >= 3 ? 2 : 1} of 3` },
              ].map((tile) => (
                <div key={tile.k} className="rounded-[11px] bg-white/[0.03] p-3">
                  <div className="font-mono-num text-[18px] text-ink-200">{tile.v}</div>
                  <div className="mt-0.5 text-[10.5px] text-mute-3">{tile.k}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="flex flex-col p-[18px]">
          <div className="text-[13px] font-bold text-ink-400">Pipeline</div>

          <div className="mt-3.5 flex flex-col gap-0.5">
            {PIPELINE.map((stage, index) => {
              const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "wait";
              return (
                <div
                  key={stage}
                  className={cn(
                    "flex items-center gap-3 rounded-[10px] px-3 py-2.5",
                    state === "active" && "bg-brand/[0.12]"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border",
                      state === "wait" ? "border-white/[0.16]" : "border-brand/60",
                      state === "done" && "bg-brand",
                      state === "active" && "bg-brand/35"
                    )}
                  >
                    {state === "done" && <Check className="h-2.5 w-2.5 text-white" />}
                    {state === "active" && <Loader2 className="h-2.5 w-2.5 animate-spin text-white" />}
                  </span>
                  <span
                    className={cn(
                      "flex-1 truncate text-[13.5px] font-semibold",
                      state === "wait" ? "text-mute-4" : "text-ink-200"
                    )}
                  >
                    {stage}
                  </span>
                  <span className="font-mono-num text-[11px] text-mute-3">
                    {state === "done" ? "complete" : state === "active" ? "running" : "queued"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-[11px] border border-warn/35 bg-warn/[0.06] p-3.5 text-[12.5px] leading-[1.55] text-warn/90">
            The footage is analysed in three passes — detection and tracking, event logging, then
            tactics and the report. Anything the model is unsure about is flagged in the finished
            report rather than presented as fact.
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="mt-3 w-full rounded-[11px] border border-white/[0.12] bg-white/[0.03] py-3 text-[13.5px] font-bold text-ink-300 transition-colors hover:border-bad/40 hover:text-bad"
          >
            Cancel analysis
          </button>
        </Panel>
      </div>
    </div>
  );
}
