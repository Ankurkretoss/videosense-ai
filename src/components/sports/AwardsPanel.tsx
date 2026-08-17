"use client";

import { motion } from "framer-motion";
import { Award as AwardIcon, Trophy } from "lucide-react";
import { SectionCard, JerseyBadge } from "./report-ui";
import type { Award } from "@/types/sports-analysis";

interface AwardsPanelProps {
  awards: Award[];
  teamAName: string;
}

export function AwardsPanel({ awards, teamAName }: AwardsPanelProps) {
  if (awards.length === 0) return null;

  return (
    <SectionCard
      title="Standout performers"
      icon={<Trophy className="h-5 w-5 text-amber-400" />}
      description="Each award is justified by what happened on screen."
    >
      <div className="grid items-start gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {awards.map((award, index) => {
          const teamId = award.team.toLowerCase() === teamAName.toLowerCase() ? "A" : "B";
          const isMotm = /man of the match/i.test(award.category);

          return (
            <motion.div
              key={`${award.category}-${index}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={
                isMotm
                  ? "rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:col-span-2"
                  : "rounded-xl border border-white/10 bg-white/5 p-4"
              }
            >
              <div className="flex items-center gap-3">
                <JerseyBadge number={award.jerseyNumber} teamId={teamId} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-white">
                    {isMotm && <AwardIcon className="h-4 w-4 text-amber-400" />}
                    {award.category}
                  </p>
                  <p className="truncate text-xs text-gray-500">{award.team}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-300">{award.reason}</p>
            </motion.div>
          );
        })}
      </div>
    </SectionCard>
  );
}
