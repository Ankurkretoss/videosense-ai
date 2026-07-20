"use client";

import { motion } from "framer-motion";
import { Film } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SceneCard } from "./SceneCard";
import type { Scene } from "@/types/analysis";

interface SceneGridProps {
  scenes: Scene[];
}

export function SceneGrid({ scenes }: SceneGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Film className="h-5 w-5 text-indigo-400" />
            Scene Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {scenes.map((scene, index) => (
              <SceneCard key={index} scene={scene} index={index} />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
