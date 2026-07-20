"use client";

import { useState } from "react";
import { Video, Link } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { YOUTUBE_URL_PATTERN } from "@/lib/constants";

interface YouTubeInputProps {
  onUrlSubmit: (url: string) => void;
  hasUpload: boolean;
}

export function YouTubeInput({ onUrlSubmit, hasUpload }: YouTubeInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    if (!YOUTUBE_URL_PATTERN.test(url)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    onUrlSubmit(url);
    setUrl("");
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-red-500/10 p-2">
          <Video className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">YouTube URL</h3>
          <p className="text-sm text-gray-400">Paste a YouTube video link</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-gray-500"
            disabled={hasUpload}
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          disabled={hasUpload || !url.trim()}
        >
          Add URL
        </Button>
      </form>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
