"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Clock,
  Film,
  FileText,
  Tag,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  Clock,
  Film,
  FileText,
  Tag,
  CheckSquare,
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  index: number;
}

export function FeatureCard({ title, description, icon, index }: FeatureCardProps) {
  const Icon = iconMap[icon] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="group border-white/10 bg-white/5 transition-all hover:border-indigo-500/50 hover:bg-white/10">
        <CardContent className="p-6">
          <div className="mb-4 inline-flex rounded-lg bg-indigo-500/10 p-3">
            <Icon className="h-6 w-6 text-indigo-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
