"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UploadProgress } from "@/types/analysis";

interface ProgressCardProps {
  progress: UploadProgress;
}

export function ProgressCard({ progress }: ProgressCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
            <div className="flex-1">
              <p className="font-medium text-white">{progress.message}</p>
              <Progress value={progress.progress} className="mt-2" />
            </div>
            <span className="text-sm text-gray-400">
              {Math.round(progress.progress)}%
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
