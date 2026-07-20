"use client";

import { motion } from "framer-motion";
import { CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActionItemsProps {
  items: string[];
}

export function ActionItems({ items }: ActionItemsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckSquare className="h-5 w-5 text-emerald-400" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {items.map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-emerald-500/50 bg-emerald-500/10">
                  <CheckSquare className="h-3 w-3 text-emerald-400" />
                </div>
                <span className="text-gray-300">{item}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
