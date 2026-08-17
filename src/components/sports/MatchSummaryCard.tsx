"use client";

import { motion } from "framer-motion";
import { Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SportsAnalysis } from "@/types/sports-analysis";

interface MatchSummaryCardProps {
  sport: string;
  matchSummary: SportsAnalysis["matchSummary"];
  playerCount: SportsAnalysis["playerCount"];
}

export function MatchSummaryCard({ sport, matchSummary, playerCount }: MatchSummaryCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-indigo-400" />
            Match Summary
            <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400">
              {sport}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white">{matchSummary.short}</p>
          <p className="text-sm text-gray-400">{matchSummary.detailed}</p>

          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">Total</span>
              </div>
              <p className="mt-1 text-2xl font-semibold text-white">{playerCount.total}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="truncate text-xs text-indigo-400">{playerCount.teamA.name}</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {playerCount.teamA.playerCount}
              </p>
              <p className="truncate text-xs text-gray-500">
                {playerCount.teamA.shirtColor}
                {playerCount.teamA.formation ? ` · ${playerCount.teamA.formation}` : ""}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-3 text-center">
              <p className="truncate text-xs text-rose-400">{playerCount.teamB.name}</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {playerCount.teamB.playerCount}
              </p>
              <p className="truncate text-xs text-gray-500">
                {playerCount.teamB.shirtColor}
                {playerCount.teamB.formation ? ` · ${playerCount.teamB.formation}` : ""}
              </p>
            </div>
          </div>

          {playerCount.notes && (
            <p className="text-xs text-gray-500">Note: {playerCount.notes}</p>
          )}

          {matchSummary.phases.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <h4 className="mb-3 text-sm font-medium text-gray-400">How the match unfolded</h4>
              <div className="grid items-start gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {matchSummary.phases.map((phase, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="h-full rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400">
                        {phase.range}
                      </span>
                      <span className="text-sm font-medium text-white">{phase.title}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-400">{phase.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
