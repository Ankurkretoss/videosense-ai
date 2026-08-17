"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Dumbbell, Lightbulb, Target, TrendingUp } from "lucide-react";
import { SectionCard, FilterChips, jerseyDisplay } from "./report-ui";
import { timeToSeconds } from "@/lib/time";
import type { Improvement } from "@/types/sports-analysis";

interface ImprovementListProps {
  improvements: Improvement[];
  tacticalInsights: string[];
  onSeek?: (seconds: number) => void;
}

export function ImprovementList({
  improvements,
  tacticalInsights,
  onSeek,
}: ImprovementListProps) {
  const [area, setArea] = useState("all");

  if (improvements.length === 0 && tacticalInsights.length === 0) return null;

  const areas = Array.from(new Set(improvements.map((item) => item.area))).filter(Boolean);
  const visible =
    area === "all" ? improvements : improvements.filter((item) => item.area === area);

  return (
    <>
      {improvements.length > 0 && (
        <SectionCard
          title={`Coaching improvements (${improvements.length})`}
          icon={<TrendingUp className="h-5 w-5 text-amber-400" />}
          description="Each point is tied to a moment in the footage and comes with a drill to fix it."
        >
          {areas.length > 1 && (
            <div className="mb-4">
              <FilterChips
                options={[
                  { value: "all", label: "All areas", count: improvements.length },
                  ...areas.map((item) => ({
                    value: item,
                    label: item,
                    count: improvements.filter((entry) => entry.area === item).length,
                  })),
                ]}
                value={area}
                onChange={setArea}
              />
            </div>
          )}

          <div className="grid items-start gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {visible.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.4) }}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300">
                    {item.area}
                  </span>
                  {item.jerseyNumber && item.jerseyNumber !== "team" && (
                    <span className="text-sm font-medium text-white">{jerseyDisplay(item.jerseyNumber).short}</span>
                  )}
                  {item.team && <span className="text-xs text-gray-500">{item.team}</span>}
                  {item.timestamp && (
                    <button
                      type="button"
                      disabled={!onSeek}
                      onClick={() => onSeek?.(timeToSeconds(item.timestamp))}
                      className="ml-auto inline-flex items-center gap-1 text-xs text-indigo-400 disabled:text-gray-500"
                    >
                      <Clock className="h-3 w-3" />
                      {item.timestamp}
                    </button>
                  )}
                </div>

                <p className="mt-2 text-sm text-gray-200">{item.issue}</p>

                {item.recommendation && (
                  <p className="mt-2 flex items-start gap-2 text-sm text-emerald-200/90">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {item.recommendation}
                  </p>
                )}

                {item.drill && (
                  <p className="mt-2 flex items-start gap-2 rounded-lg bg-black/25 p-2.5 text-xs text-gray-400">
                    <Dumbbell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                    <span>
                      <span className="text-gray-300">Drill: </span>
                      {item.drill}
                    </span>
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </SectionCard>
      )}

      {tacticalInsights.length > 0 && (
        <SectionCard
          title={`Tactical insights (${tacticalInsights.length})`}
          icon={<Target className="h-5 w-5 text-indigo-400" />}
        >
          <ul className="grid items-start gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {tacticalInsights.map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.4) }}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                <span className="text-sm text-gray-300">{item}</span>
              </motion.li>
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}
