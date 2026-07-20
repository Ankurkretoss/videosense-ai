"use client";

import { motion } from "framer-motion";
import { Camera, Users, Activity, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Scene } from "@/types/analysis";

interface SceneCardProps {
  scene: Scene;
  index: number;
}

export function SceneCard({ scene, index }: SceneCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-indigo-500/50"
    >
      {scene.thumbnail && (
        <img
          src={scene.thumbnail}
          alt={scene.description}
          className="aspect-video w-full object-cover"
        />
      )}

      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Camera className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-medium text-indigo-400">
            {scene.timestamp}
          </span>
        </div>

        <p className="mb-4 text-sm text-white">{scene.description}</p>

        <div className="space-y-3">
          {scene.objects.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
                <Box className="h-3 w-3" />
                Objects
              </div>
              <div className="flex flex-wrap gap-1">
                {scene.objects.map((obj, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-white/10 text-xs text-gray-300"
                  >
                    {obj}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {scene.people.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
                <Users className="h-3 w-3" />
                People
              </div>
              <div className="flex flex-wrap gap-1">
                {scene.people.map((person, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-white/10 text-xs text-gray-300"
                  >
                    {person}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {scene.activities.length > 0 && (
            <div>
              <div className="mb-1 flex items-center gap-1 text-xs text-gray-400">
                <Activity className="h-3 w-3" />
                Activities
              </div>
              <div className="flex flex-wrap gap-1">
                {scene.activities.map((activity, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-white/10 text-xs text-gray-300"
                  >
                    {activity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
