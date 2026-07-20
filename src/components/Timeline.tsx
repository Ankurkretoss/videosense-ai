"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimelineEntry } from "@/types/analysis";

interface TimelineProps {
  entries: TimelineEntry[];
}

export function Timeline({ entries }: TimelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5 text-indigo-400" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative ml-4 border-l-2 border-white/10 pl-8">
            {entries.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative mb-8 last:mb-0"
              >
                <div className="absolute -left-[41px] flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-400">
                      {entry.timestamp}
                    </span>
                  </div>
                  <h4 className="font-medium text-white">{entry.title}</h4>
                  <p className="mt-1 text-sm text-gray-400">
                    {entry.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
