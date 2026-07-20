"use client";

import { motion } from "framer-motion";

interface LoadingAnimationProps {
  message?: string;
}

export function LoadingAnimation({ message = "Loading..." }: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        <motion.div
          className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 h-16 w-16 rounded-full border-4 border-purple-500/20 border-t-purple-500"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 h-4 w-1/3 rounded bg-white/10" />
      <div className="mb-2 h-3 w-full rounded bg-white/10" />
      <div className="mb-2 h-3 w-3/4 rounded bg-white/10" />
      <div className="h-3 w-1/2 rounded bg-white/10" />
    </div>
  );
}
