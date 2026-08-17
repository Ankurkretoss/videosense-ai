"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Flag,
  Hand,
  Move,
  Repeat,
  Scale,
  Shield,
  Swords,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { SectionCard } from "./report-ui";
import { timeToSeconds } from "@/lib/time";
import type { KeyBattle, SectionNarratives, TurningPoint } from "@/types/sports-analysis";

interface NarrativePanelProps {
  narratives: SectionNarratives;
  turningPoints: TurningPoint[];
  keyBattles: KeyBattle[];
  onSeek?: (seconds: number) => void;
}

const SECTIONS: { key: keyof SectionNarratives; label: string; icon: ReactNode }[] = [
  { key: "attacking", label: "Attacking play", icon: <Zap className="h-4 w-4 text-emerald-400" /> },
  { key: "defending", label: "Defending", icon: <Shield className="h-4 w-4 text-sky-400" /> },
  { key: "passing", label: "Passing & circulation", icon: <Repeat className="h-4 w-4 text-indigo-400" /> },
  { key: "physical", label: "Physical output", icon: <Move className="h-4 w-4 text-fuchsia-400" /> },
  { key: "goalkeeping", label: "Goalkeeping", icon: <Hand className="h-4 w-4 text-amber-400" /> },
  { key: "setPieces", label: "Set pieces", icon: <Flag className="h-4 w-4 text-cyan-400" /> },
  { key: "refereeing", label: "Refereeing", icon: <Scale className="h-4 w-4 text-gray-400" /> },
  { key: "momentum", label: "Momentum", icon: <TrendingUp className="h-4 w-4 text-rose-400" /> },
];

export function NarrativePanel({
  narratives,
  turningPoints,
  keyBattles,
  onSeek,
}: NarrativePanelProps) {
  const written = SECTIONS.filter((section) => narratives[section.key]);

  return (
    <>
      {written.length > 0 && (
        <SectionCard
          title="Themed analysis"
          icon={<BookOpen className="h-5 w-5 text-indigo-400" />}
          description="The written read on each part of the game, backed by timestamps."
        >
          <div className="grid items-start gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {written.map((section, index) => (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3) }}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <p className="flex items-center gap-2 text-sm font-medium text-white">
                  {section.icon}
                  {section.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  {narratives[section.key]}
                </p>
              </motion.div>
            ))}
          </div>
        </SectionCard>
      )}

      {turningPoints.length > 0 && (
        <SectionCard
          title={`Turning points (${turningPoints.length})`}
          icon={<Zap className="h-5 w-5 text-amber-400" />}
          description="The moments that changed the direction of the match."
        >
          <div className="grid items-start gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {turningPoints.map((point, index) => (
              <motion.div
                key={`${point.timestamp}-${index}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!onSeek}
                    onClick={() => onSeek?.(timeToSeconds(point.timestamp))}
                    className="text-sm font-medium text-amber-300 disabled:text-amber-300/70"
                  >
                    {point.timestamp}
                  </button>
                  <span className="font-medium text-white">{point.title}</span>
                </div>
                <p className="mt-2 text-sm text-gray-300">{point.description}</p>
                {point.impact && (
                  <p className="mt-2 text-xs text-amber-200/80">Impact: {point.impact}</p>
                )}
              </motion.div>
            ))}
          </div>
        </SectionCard>
      )}

      {keyBattles.length > 0 && (
        <SectionCard
          title={`Key battles (${keyBattles.length})`}
          icon={<Swords className="h-5 w-5 text-fuchsia-400" />}
          description="The individual duels that shaped the game."
        >
          <div className="grid items-start gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {keyBattles.map((battle, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm font-medium text-white">{battle.matchup}</p>
                <p className="mt-1.5 text-sm text-gray-300">{battle.description}</p>
                {battle.winner && (
                  <p className="mt-2 text-xs text-emerald-300">Edge: {battle.winner}</p>
                )}
              </motion.div>
            ))}
          </div>
        </SectionCard>
      )}
    </>
  );
}
