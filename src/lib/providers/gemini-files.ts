/**
 * Gemini Files API helpers.
 *
 * Match footage is far too large to inline as base64 in a generateContent request
 * (the inline limit is ~20 MB for the whole request), so local files are uploaded
 * once with the resumable upload protocol and then referenced by URI in every
 * analysis pass.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com";

export interface UploadedFile {
  uri: string;
  mimeType: string;
  name: string;
  sizeBytes: number;
}

export interface UploadOptions {
  onProgress?: (ratio: number) => void;
  onStateChange?: (state: string) => void;
  signal?: AbortSignal;
}

function resolveMimeType(file: File): string {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "mov":
      return "video/quicktime";
    case "mkv":
      return "video/x-matroska";
    case "webm":
      return "video/webm";
    default:
      return "video/mp4";
  }
}

async function startResumableUpload(
  file: File,
  apiKey: string,
  mimeType: string,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(`${GEMINI_BASE}/upload/v1beta/files?key=${apiKey}`, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(file.size),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: file.name } }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Could not start the video upload: ${await response.text()}`);
  }

  const uploadUrl = response.headers.get("x-goog-upload-url");
  if (!uploadUrl) {
    throw new Error("Gemini did not return an upload URL for this video.");
  }

  return uploadUrl;
}

function uploadBytes(
  uploadUrl: string,
  file: File,
  onProgress?: (ratio: number) => void,
  signal?: AbortSignal
): Promise<{ uri: string; name: string; mimeType: string; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", uploadUrl, true);
    request.setRequestHeader("Content-Length", String(file.size));
    request.setRequestHeader("X-Goog-Upload-Offset", "0");
    request.setRequestHeader("X-Goog-Upload-Command", "upload, finalize");

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(event.loaded / event.total);
      }
    };

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`Video upload failed (${request.status}): ${request.responseText}`));
        return;
      }
      try {
        const payload = JSON.parse(request.responseText);
        const uploaded = payload.file;
        if (!uploaded?.uri) {
          reject(new Error("Video upload finished but Gemini returned no file URI."));
          return;
        }
        onProgress?.(1);
        resolve({
          uri: uploaded.uri,
          name: uploaded.name,
          mimeType: uploaded.mimeType,
          sizeBytes: Number(uploaded.sizeBytes || file.size),
        });
      } catch {
        reject(new Error("Could not read the upload response from Gemini."));
      }
    };

    request.onerror = () => reject(new Error("Network error while uploading the video."));
    request.onabort = () => reject(new Error("Video upload cancelled."));

    signal?.addEventListener("abort", () => request.abort(), { once: true });
    request.send(file);
  });
}

async function waitUntilActive(
  fileName: string,
  apiKey: string,
  options: UploadOptions
): Promise<void> {
  const deadline = Date.now() + 10 * 60 * 1000;

  while (Date.now() < deadline) {
    if (options.signal?.aborted) throw new Error("Video processing cancelled.");

    const response = await fetch(`${GEMINI_BASE}/v1beta/${fileName}?key=${apiKey}`, {
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(`Could not check the uploaded video: ${await response.text()}`);
    }

    const file = await response.json();
    options.onStateChange?.(file.state);

    if (file.state === "ACTIVE") return;
    if (file.state === "FAILED") {
      throw new Error(
        file.error?.message || "Gemini could not process this video file. Try a different format."
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Timed out waiting for Gemini to process the video.");
}

export async function uploadVideoToGemini(
  file: File,
  apiKey: string,
  options: UploadOptions = {}
): Promise<UploadedFile> {
  const mimeType = resolveMimeType(file);
  const uploadUrl = await startResumableUpload(file, apiKey, mimeType, options.signal);
  const uploaded = await uploadBytes(uploadUrl, file, options.onProgress, options.signal);

  // `name` comes back as "files/abc123"; the status endpoint expects that full path.
  await waitUntilActive(uploaded.name, apiKey, options);

  return {
    uri: uploaded.uri,
    mimeType: uploaded.mimeType || mimeType,
    name: uploaded.name,
    sizeBytes: uploaded.sizeBytes,
  };
}
