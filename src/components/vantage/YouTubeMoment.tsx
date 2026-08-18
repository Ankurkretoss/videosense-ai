"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ExternalLink } from "lucide-react";

/**
 * Plays one moment of a YouTube video inline.
 *
 * Some owners disable playback on other sites; the iframe then shows YouTube's own
 * grey "Video unavailable" box, which reads like our app broke. The player API
 * reports that as error 101/150, so it is caught here and replaced with a clear
 * message and a direct link.
 */

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: Record<string, unknown>) => unknown;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_SRC = "https://www.youtube.com/iframe_api";
let apiPromise: Promise<void> | null = null;

function loadPlayerApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = API_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}

interface YouTubeMomentProps {
  videoId: string;
  startSeconds: number;
  title: string;
  autoplay?: boolean;
  className?: string;
}

export function YouTubeMoment({
  videoId,
  startSeconds,
  title,
  autoplay = true,
  className,
}: YouTubeMomentProps) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const [blockedFor, setBlockedFor] = useState<string | null>(null);
  const [apiFailed, setApiFailed] = useState(false);
  // Derived so a new moment starts clean without a setState inside the effect.
  const momentKey = `${videoId}@${Math.floor(startSeconds)}`;
  const blocked = blockedFor === momentKey;

  useEffect(() => {
    let cancelled = false;

    // If the API is blocked (extensions, network), still show a plain embed.
    const apiTimeout = setTimeout(() => {
      if (!cancelled && !window.YT?.Player) setApiFailed(true);
    }, 4000);

    void loadPlayerApi().then(() => {
      clearTimeout(apiTimeout);
      if (cancelled || !holderRef.current || !window.YT?.Player) return;

      new window.YT.Player(holderRef.current, {
        videoId,
        playerVars: {
          start: Math.floor(startSeconds),
          autoplay: autoplay ? 1 : 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onError: ({ data }: { data: number }) => {
            // 101 and 150 both mean "embedding disabled by the owner".
            if (!cancelled && [101, 150, 100, 5, 2].includes(data)) setBlockedFor(momentKey);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(apiTimeout);
    };
  }, [videoId, startSeconds, autoplay, momentKey]);

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(startSeconds)}s`;

  if (blocked) {
    return (
      <div className={className}>
        <div className="flex h-full flex-col items-center justify-center gap-2.5 bg-ink-600 p-5 text-center">
          <AlertCircle className="h-5 w-5 text-warn" />
          <p className="text-[13px] font-semibold text-ink-200">
            The video owner blocked playback outside YouTube
          </p>
          <p className="text-[11.5px] leading-[1.5] text-mute-3">
            This is a setting on the video itself, not on this report.
          </p>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-brand/35 bg-brand/[0.12] px-3 py-2 text-[12px] font-semibold text-brand-soft hover:bg-brand/20"
          >
            <ExternalLink className="h-3 w-3" />
            Watch this moment on YouTube
          </a>
        </div>
      </div>
    );
  }

  if (apiFailed) {
    return (
      <div className={className}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?start=${Math.floor(startSeconds)}${
            autoplay ? "&autoplay=1" : ""
          }&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0 bg-black"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={holderRef} title={title} className="h-full w-full bg-black" />
    </div>
  );
}
