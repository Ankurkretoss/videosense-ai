"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ListOrdered } from "lucide-react";
import { SectionCard, FilterChips, JerseyTag } from "./report-ui";
import { timeToSeconds } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { MatchTimelineEvent } from "@/types/sports-analysis";

interface MatchTimelineProps {
  timeline: MatchTimelineEvent[];
  onSeek?: (seconds: number) => void;
}

const TYPE_TONE: Record<string, string> = {
  goal: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  shot: "border-indigo-500/50 bg-indigo-500/10 text-indigo-300",
  save: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  foul: "border-orange-500/50 bg-orange-500/10 text-orange-300",
  card: "border-red-500/50 bg-red-500/10 text-red-300",
  substitution: "border-sky-500/50 bg-sky-500/10 text-sky-300",
};

function toneFor(type: string): string {
  const key = Object.keys(TYPE_TONE).find((candidate) => type.toLowerCase().includes(candidate));
  return key ? TYPE_TONE[key] : "border-white/15 bg-white/5 text-gray-300";
}

export function MatchTimeline({ timeline, onSeek }: MatchTimelineProps) {
  const [filter, setFilter] = useState("all");

  if (timeline.length === 0) return null;

  const types = Array.from(new Set(timeline.map((event) => event.type.toLowerCase())));
  const options = [
    { value: "all", label: "All events", count: timeline.length },
    ...types.map((type) => ({
      value: type,
      label: type,
      count: timeline.filter((event) => event.type.toLowerCase() === type).length,
    })),
  ];

  const visible =
    filter === "all" ? timeline : timeline.filter((event) => event.type.toLowerCase() === filter);

  return (
    <SectionCard
      title={`Event timeline (${timeline.length})`}
      icon={<ListOrdered className="h-5 w-5 text-indigo-400" />}
      description={onSeek ? "Click any entry to jump to that moment in the video." : undefined}
    >
      {options.length > 2 && (
        <div className="mb-4">
          <FilterChips options={options} value={filter} onChange={setFilter} />
        </div>
      )}

      <div className="grid items-start gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {visible.map((event, index) => (
          <motion.div
            key={`${event.timestamp}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.4) }}
            className="h-full"
          >
            <button
              type="button"
              disabled={!onSeek}
              onClick={() => onSeek?.(timeToSeconds(event.timestamp))}
              className={cn(
                "h-full w-full rounded-xl border border-white/10 border-l-2 border-l-indigo-500/70 bg-white/5 p-3 text-left transition-colors",
                onSeek && "hover:border-indigo-500/40 hover:bg-white/10"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-medium text-indigo-400">
                  <Clock className="h-3 w-3" />
                  {event.timestamp}
                </span>
                <span className={cn("rounded-full border px-2 py-0.5 text-[11px]", toneFor(event.type))}>
                  {event.type}
                </span>
                {event.jerseyNumber && (
                  <span className="text-xs text-gray-400">
                    <JerseyTag number={event.jerseyNumber} />
                  </span>
                )}
                {event.team && <span className="text-xs text-gray-500">{event.team}</span>}
              </div>
              <p className="mt-1 text-sm font-medium text-white">{event.title}</p>
              {event.description && (
                <p className="mt-0.5 text-sm text-gray-400">{event.description}</p>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </SectionCard>
  );
}
