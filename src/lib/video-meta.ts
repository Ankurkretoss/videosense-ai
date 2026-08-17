export interface VideoProbe {
  durationSeconds: number;
  width: number;
  height: number;
  thumbnail: string;
}

const EMPTY_PROBE: VideoProbe = { durationSeconds: 0, width: 0, height: 0, thumbnail: "" };

function captureThumbnail(video: HTMLVideoElement): string {
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / (video.videoWidth || 640));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return "";
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    return "";
  }
}

/** Reads duration, resolution and a poster frame locally so the report has real metadata. */
export function probeVideoFile(file: File): Promise<VideoProbe> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(EMPTY_PROBE);
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const finish = (probe: VideoProbe) => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      resolve(probe);
    };

    const timeout = setTimeout(() => finish(EMPTY_PROBE), 15000);

    video.onloadeddata = () => {
      const base: VideoProbe = {
        durationSeconds: Number.isFinite(video.duration) ? video.duration : 0,
        width: video.videoWidth,
        height: video.videoHeight,
        thumbnail: "",
      };

      const seekTarget = Math.min(1, Math.max(0, base.durationSeconds / 10));
      video.onseeked = () => {
        clearTimeout(timeout);
        finish({ ...base, thumbnail: captureThumbnail(video) });
      };
      video.currentTime = seekTarget;
    };

    video.onerror = () => {
      clearTimeout(timeout);
      finish(EMPTY_PROBE);
    };

    video.src = url;
  });
}

export function youtubeVideoId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{6,})/);
  return match ? match[1] : null;
}

export function youtubeThumbnail(url: string): string {
  const id = youtubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}
