"use client";

import { motion } from "framer-motion";
import { Video } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No video selected",
  description = "Upload a video or paste a YouTube URL to get started.",
  icon,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 py-16"
    >
      <div className="mb-4 rounded-full bg-white/5 p-4">
        {icon || <Video className="h-8 w-8 text-gray-500" />}
      </div>
      <h3 className="mb-2 text-lg font-medium text-white">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </motion.div>
  );
}
