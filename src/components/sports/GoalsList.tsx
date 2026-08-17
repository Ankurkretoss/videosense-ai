"use client";

import { motion } from "framer-motion";
import { Goal as GoalIcon, Clock, Play, Users, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionCard, JerseyBadge, jerseyDisplay } from "./report-ui";
import { timeToSeconds } from "@/lib/time";
import type { GoalEvent } from "@/types/sports-analysis";

interface GoalsListProps {
  goals: GoalEvent[];
  teamAName: string;
  onSeek?: (seconds: number) => void;
}

export function GoalsList({ goals, teamAName, onSeek }: GoalsListProps) {
  if (goals.length === 0) {
    return (
      <SectionCard title="Goals (0)" icon={<GoalIcon className="h-5 w-5 text-emerald-400" />}>
        <p className="py-4 text-sm text-gray-500">No goals were detected in this footage.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={`Goals (${goals.length})`}
      icon={<GoalIcon className="h-5 w-5 text-emerald-400" />}
      description="Scorer, assist, build-up, kick type and angle for every goal."
    >
      <div className="grid items-start gap-4 2xl:grid-cols-2">
        {goals.map((goal, index) => {
          const teamId = goal.scorerTeam.toLowerCase() === teamAName.toLowerCase() ? "A" : "B";
          return (
            <motion.div
              key={`${goal.timestamp}-${index}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <JerseyBadge number={goal.scorerJerseyNumber} teamId={teamId} />
                <span className="font-medium text-white">
                  {jerseyDisplay(goal.scorerJerseyNumber).label} · {goal.scorerTeam}
                </span>
                <Badge variant="secondary" className="gap-1 bg-white/10 text-xs text-gray-300">
                  <Clock className="h-3 w-3" />
                  {goal.timestamp}
                </Badge>
                {goal.assistJerseyNumber && (
                  <Badge variant="secondary" className="bg-white/10 text-xs text-gray-300">
                    Assist {jerseyDisplay(goal.assistJerseyNumber).short}
                  </Badge>
                )}
                {goal.goalProbability > 0 && (
                  <Badge variant="secondary" className="bg-white/10 text-xs text-gray-300">
                    Chance quality {goal.goalProbability}%
                  </Badge>
                )}
                {onSeek && (
                  <button
                    type="button"
                    onClick={() => onSeek(timeToSeconds(goal.timestamp))}
                    className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300 transition-colors hover:border-indigo-500/40 hover:text-white"
                  >
                    <Play className="h-3 w-3" />
                    Watch
                  </button>
                )}
              </div>

              <p className="mt-3 text-sm text-white">{goal.description}</p>

              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-lg bg-black/20 p-2.5">
                  <dt className="text-gray-500">Kick type</dt>
                  <dd className="mt-0.5 text-gray-200">{goal.kickType || "—"}</dd>
                </div>
                <div className="rounded-lg bg-black/20 p-2.5">
                  <dt className="text-gray-500">Kick angle</dt>
                  <dd className="mt-0.5 text-gray-200">{goal.kickAngle || "—"}</dd>
                </div>
                {goal.buildUp && (
                  <div className="rounded-lg bg-black/20 p-2.5 sm:col-span-2">
                    <dt className="text-gray-500">Build-up</dt>
                    <dd className="mt-0.5 text-gray-200">{goal.buildUp}</dd>
                  </div>
                )}
                {goal.goalkeeperPosition && (
                  <div className="rounded-lg bg-black/20 p-2.5 sm:col-span-2">
                    <dt className="text-gray-500">Goalkeeper</dt>
                    <dd className="mt-0.5 text-gray-200">{goal.goalkeeperPosition}</dd>
                  </div>
                )}
              </dl>

              {goal.passSequence.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gray-500" />
                  {goal.passSequence.map((step, stepIndex) => (
                    <span key={stepIndex} className="flex items-center gap-1.5">
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-gray-300">{step}</span>
                      {stepIndex < goal.passSequence.length - 1 && (
                        <span className="text-gray-600">→</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {goal.defensiveErrors.length > 0 && (
                <div className="mt-3 space-y-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-amber-300">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Defensive mistakes
                  </p>
                  {goal.defensiveErrors.map((error, errorIndex) => (
                    <p key={errorIndex} className="text-xs text-amber-100/70">
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </SectionCard>
  );
}
