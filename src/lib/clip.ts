import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { timeToSeconds } from "@/lib/time";

export { timeToSeconds };

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;
let activeProgressCallback: ((ratio: number) => void) | null = null;
let recentLogs: string[] = [];

/**
 * ffmpeg.wasm rejects with plain objects and strings as often as with Errors
 * (worker messages are structured-cloned), so everything gets normalised here —
 * otherwise the UI can only ever show "something failed".
 */
function toError(cause: unknown, context: string): Error {
  if (cause instanceof Error) return new Error(`${context}: ${cause.message}`);

  const message =
    typeof cause === "string"
      ? cause
      : typeof (cause as { message?: unknown })?.message === "string"
        ? (cause as { message: string }).message
        : JSON.stringify(cause);

  return new Error(`${context}: ${message}`);
}

function ffmpegTail(lines = 4): string {
  const tail = recentLogs.filter((line) => line.trim()).slice(-lines);
  return tail.length > 0 ? ` (ffmpeg said: ${tail.join(" | ")})` : "";
}

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const instance = new FFmpeg();

    instance.on("progress", ({ progress }) => {
      activeProgressCallback?.(Math.min(1, Math.max(0, progress)));
    });
    instance.on("log", ({ message }) => {
      recentLogs.push(message);
      if (recentLogs.length > 40) recentLogs = recentLogs.slice(-40);
    });

    try {
      await instance.load({
        coreURL: `${window.location.origin}/ffmpeg/ffmpeg-core.js`,
        wasmURL: `${window.location.origin}/ffmpeg/ffmpeg-core.wasm`,
        // The bundler rewrites the packaged worker's dynamic import of the core,
        // which breaks it at runtime, so the worker is served from /public as-is.
        // It must be an absolute URL: the library resolves it against import.meta.url.
        classWorkerURL: `${window.location.origin}/ffmpeg/worker.js`,
      });
    } catch (cause) {
      loadingPromise = null;
      throw toError(cause, "Could not start the in-browser video encoder");
    }

    ffmpegInstance = instance;
    return instance;
  })();

  return loadingPromise;
}

function getExtension(filename: string): string {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1] : "mp4";
}

function toBlob(data: Uint8Array | string): Blob {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  return new Blob([bytes], { type: "video/mp4" });
}

export interface ClipWindow {
  id: string;
  label: string;
  startSeconds: number;
  endSeconds: number;
}

export interface ExtractClipOptions {
  padStartSeconds?: number;
  padEndSeconds?: number;
  onProgress?: (ratio: number) => void;
}

async function cutSegment(
  ffmpeg: FFmpeg,
  inputName: string,
  outputName: string,
  startSeconds: number,
  endSeconds: number,
  pad: { start: number; end: number }
): Promise<void> {
  const start = Math.max(0, startSeconds - pad.start);
  const duration = Math.max(0.5, endSeconds + pad.end - start);
  recentLogs = [];

  let exitCode: number;
  try {
    exitCode = await ffmpeg.exec([
      "-ss",
      start.toFixed(2),
      "-i",
      inputName,
      "-t",
      duration.toFixed(2),
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      outputName,
    ]);
  } catch (cause) {
    throw toError(cause, `Cutting the clip failed${ffmpegTail()}`);
  }

  if (exitCode !== 0) {
    throw new Error(`ffmpeg exited with code ${exitCode}${ffmpegTail(6)}`);
  }
}

async function readOutput(ffmpeg: FFmpeg, outputName: string): Promise<Blob> {
  try {
    return toBlob(await ffmpeg.readFile(outputName));
  } catch (cause) {
    throw toError(cause, `The clip was not produced${ffmpegTail()}`);
  }
}

async function writeInput(ffmpeg: FFmpeg, name: string, file: File): Promise<void> {
  try {
    await ffmpeg.writeFile(name, await fetchFile(file));
  } catch (cause) {
    throw toError(cause, "Could not load the video into the encoder");
  }
}

export async function extractClip(
  file: File,
  startSeconds: number,
  endSeconds: number,
  options: ExtractClipOptions = {}
): Promise<Blob> {
  const { padStartSeconds = 1, padEndSeconds = 1, onProgress } = options;
  const ffmpeg = await getFFmpeg();

  const uid = Math.random().toString(36).slice(2);
  const inputName = `input-${uid}.${getExtension(file.name)}`;
  const outputName = `clip-${uid}.mp4`;

  activeProgressCallback = onProgress ?? null;

  try {
    await writeInput(ffmpeg, inputName, file);
    await cutSegment(ffmpeg, inputName, outputName, startSeconds, endSeconds, {
      start: padStartSeconds,
      end: padEndSeconds,
    });
    return await readOutput(ffmpeg, outputName);
  } finally {
    activeProgressCallback = null;
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}

export interface BatchClipOptions extends ExtractClipOptions {
  /** Called as each clip finishes so the UI can show "3 of 12". */
  onClipDone?: (completed: number, total: number, label: string) => void;
  /** Delivers each clip as soon as it is cut, so the UI fills in progressively. */
  onClip?: (clip: GeneratedClip) => void;
  signal?: AbortSignal;
}

export interface GeneratedClip {
  id: string;
  label: string;
  filename: string;
  blob: Blob;
}

/**
 * Cuts many windows from one video in a single ffmpeg session — the source file
 * is only written to the virtual filesystem once, which is by far the slowest part.
 */
export async function extractClips(
  file: File,
  windows: ClipWindow[],
  options: BatchClipOptions = {}
): Promise<GeneratedClip[]> {
  const { padStartSeconds = 1, padEndSeconds = 1, onProgress, onClipDone, onClip, signal } = options;
  const ffmpeg = await getFFmpeg();

  const uid = Math.random().toString(36).slice(2);
  const inputName = `batch-${uid}.${getExtension(file.name)}`;
  const results: GeneratedClip[] = [];
  const outputs: string[] = [];

  try {
    await writeInput(ffmpeg, inputName, file);

    for (let index = 0; index < windows.length; index++) {
      if (signal?.aborted) throw new Error("Clip generation cancelled.");

      const window = windows[index];
      const outputName = `batch-${uid}-${index}.mp4`;
      outputs.push(outputName);

      activeProgressCallback = (ratio) => onProgress?.((index + ratio) / windows.length);

      await cutSegment(ffmpeg, inputName, outputName, window.startSeconds, window.endSeconds, {
        start: padStartSeconds,
        end: padEndSeconds,
      });

      const generated: GeneratedClip = {
        id: window.id,
        label: window.label,
        filename: `${slugifyFilename(window.label)}.mp4`,
        blob: await readOutput(ffmpeg, outputName),
      };

      results.push(generated);
      onClip?.(generated);
      onClipDone?.(index + 1, windows.length, window.label);
    }

    return results;
  } finally {
    activeProgressCallback = null;
    await ffmpeg.deleteFile(inputName).catch(() => {});
    for (const output of outputs) {
      await ffmpeg.deleteFile(output).catch(() => {});
    }
  }
}

/** Stitches the given windows into one continuous highlight reel. */
export async function buildHighlightReel(
  file: File,
  windows: ClipWindow[],
  options: BatchClipOptions = {}
): Promise<Blob> {
  const { padStartSeconds = 1, padEndSeconds = 1, onProgress, onClipDone, signal } = options;
  if (windows.length === 0) throw new Error("No moments selected for the reel.");

  const ffmpeg = await getFFmpeg();
  const uid = Math.random().toString(36).slice(2);
  const inputName = `reel-${uid}.${getExtension(file.name)}`;
  const segments: string[] = [];
  const listName = `reel-${uid}.txt`;
  const outputName = `reel-${uid}-out.mp4`;

  try {
    await writeInput(ffmpeg, inputName, file);

    for (let index = 0; index < windows.length; index++) {
      if (signal?.aborted) throw new Error("Reel generation cancelled.");

      const segmentName = `reel-${uid}-${index}.mp4`;
      segments.push(segmentName);
      activeProgressCallback = (ratio) => onProgress?.(((index + ratio) / windows.length) * 0.9);

      await cutSegment(
        ffmpeg,
        inputName,
        segmentName,
        windows[index].startSeconds,
        windows[index].endSeconds,
        { start: padStartSeconds, end: padEndSeconds }
      );
      onClipDone?.(index + 1, windows.length, windows[index].label);
    }

    activeProgressCallback = (ratio) => onProgress?.(0.9 + ratio * 0.1);
    await ffmpeg.writeFile(
      listName,
      new TextEncoder().encode(segments.map((segment) => `file '${segment}'`).join("\n"))
    );
    const exitCode = await ffmpeg.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listName,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      outputName,
    ]);
    if (exitCode !== 0) {
      throw new Error(`Joining the reel failed (ffmpeg code ${exitCode})${ffmpegTail(6)}`);
    }

    return await readOutput(ffmpeg, outputName);
  } finally {
    activeProgressCallback = null;
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(listName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
    for (const segment of segments) {
      await ffmpeg.deleteFile(segment).catch(() => {});
    }
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function slugifyFilename(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "clip"
  );
}
