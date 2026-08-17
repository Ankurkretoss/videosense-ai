export function timeToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  const parts = timestamp
    .trim()
    .split(":")
    .map((part) => parseFloat(part) || 0);
  return parts.reduce((total, part) => total * 60 + part, 0);
}

export function secondsToTimestamp(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatDuration(seconds: number): string {
  return secondsToTimestamp(seconds);
}
