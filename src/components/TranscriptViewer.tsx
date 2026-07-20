"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Copy, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TranscriptEntry } from "@/types/analysis";

interface TranscriptViewerProps {
  entries: TranscriptEntry[];
}

export function TranscriptViewer({ entries }: TranscriptViewerProps) {
  const [search, setSearch] = useState("");

  const filteredEntries = entries.filter(
    (entry) =>
      entry.text.toLowerCase().includes(search.toLowerCase()) ||
      entry.timestamp.includes(search)
  );

  const handleCopy = () => {
    const text = entries
      .map((e) => `${e.timestamp} - ${e.text}`)
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  const handleDownload = () => {
    const text = entries
      .map((e) => `${e.timestamp} - ${e.text}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcript.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-indigo-400" />
              Transcript
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 bg-white/5 text-white"
                onClick={handleCopy}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 bg-white/5 text-white"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search transcript..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="max-h-96 space-y-3 overflow-y-auto">
            {filteredEntries.map((entry, index) => (
              <div
                key={index}
                className="flex gap-4 rounded-lg border border-white/5 p-3 transition-colors hover:bg-white/5"
              >
                <span className="shrink-0 text-sm font-medium text-indigo-400">
                  {entry.timestamp}
                </span>
                <p className="text-gray-300">{entry.text}</p>
              </div>
            ))}
          </div>

          {filteredEntries.length === 0 && (
            <p className="py-8 text-center text-gray-500">
              No results found for &quot;{search}&quot;
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
