"use client";

import { motion } from "framer-motion";
import { FileVideo, Clock, Monitor, HardDrive, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VideoMetadata } from "@/types/analysis";

interface VideoOverviewProps {
  metadata: VideoMetadata;
}

export function VideoOverview({ metadata }: VideoOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileVideo className="h-5 w-5 text-indigo-400" />
            Video Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            {metadata.thumbnail && (
              <div className="overflow-hidden rounded-xl">
                <img
                  src={metadata.thumbnail}
                  alt={metadata.title}
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {metadata.title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{metadata.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm">{metadata.resolution}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-sm">{metadata.fileSize}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm truncate">{metadata.source}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
