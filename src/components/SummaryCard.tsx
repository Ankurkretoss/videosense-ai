"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VideoSummary } from "@/types/analysis";

interface SummaryCardProps {
  summary: VideoSummary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5 text-indigo-400" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-400">Summary</h4>
            <p className="text-white">{summary.short}</p>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-400">
              Detailed Analysis
            </h4>
            <p className="text-gray-300">{summary.detailed}</p>
          </div>
          <div className="rounded-lg bg-indigo-500/10 p-4">
            <h4 className="mb-2 text-sm font-medium text-indigo-400">
              Conclusion
            </h4>
            <p className="text-white">{summary.conclusion}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
