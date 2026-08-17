import type { VideoAnalysis, VideoMetadata } from "@/types/analysis";
import type { SportsAnalysis } from "@/types/sports-analysis";
import type { AIProvider, SportsAnalysisOptions } from "@/lib/ai";
import { buildEventPrompt, buildReportPrompt, buildScanPrompt } from "./sports-prompt";
import { parseLooseJson } from "./json-parse";
import { uploadVideoToGemini } from "./gemini-files";
import { buildSportsAnalysis } from "@/lib/sports-normalize";
import { probeVideoFile, youtubeThumbnail } from "@/lib/video-meta";
import { secondsToTimestamp } from "@/lib/time";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const MAX_OUTPUT_TOKENS = 65536;

interface VideoSourcePart {
  uri: string;
  mimeType?: string;
  durationSeconds: number;
  sourceHint: string;
}

interface PassResult {
  data: Record<string, unknown>;
  truncated: boolean;
}

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || "gemini-3.5-flash";
  }

  private async generateContent(prompt: string): Promise<string> {
    const response = await fetch(
      `${GEMINI_API_URL}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No content in Gemini response");
    }

    return text;
  }

  private parseAnalysis(jsonStr: string): VideoAnalysis {
    const cleaned = jsonStr.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned) as VideoAnalysis;
  }

  private async extractAudioFromFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  }

  private async transcribeWithGemini(file: File): Promise<string> {
    const audioBuffer = await this.extractAudioFromFile(file);
    const base64Audio = btoa(
      new Uint8Array(audioBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    const response = await fetch(
      `${GEMINI_API_URL}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: file.type || "video/mp4",
                    data: base64Audio,
                  },
                },
                {
                  text: "Analyze this video. Provide a detailed transcription of all spoken content with timestamps in MM:SS format. Then provide a comprehensive analysis including: summary, timeline of sections, scene descriptions, topics, keywords, action items, and insights. Return the response as valid JSON with this exact structure:\n{\n  \"metadata\": { \"title\": string, \"source\": string, \"duration\": string, \"resolution\": string, \"fileSize\": string, \"thumbnail\": \"\" },\n  \"summary\": { \"short\": string, \"detailed\": string, \"conclusion\": string },\n  \"timeline\": [{ \"timestamp\": \"MM:SS\", \"title\": string, \"description\": string }],\n  \"transcript\": [{ \"timestamp\": \"MM:SS\", \"text\": string }],\n  \"scenes\": [{ \"timestamp\": \"MM:SS\", \"thumbnail\": \"\", \"description\": string, \"objects\": [string], \"people\": [string], \"activities\": [string] }],\n  \"topics\": [string],\n  \"keywords\": [string],\n  \"actionItems\": [string],\n  \"insights\": [string]\n}",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini transcription failed: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No content in Gemini response");
    }

    return text;
  }

  async analyzeVideo(file: File): Promise<VideoAnalysis> {
    const result = await this.transcribeWithGemini(file);
    try {
      return this.parseAnalysis(result);
    } catch {
      const prompt = `Parse this text into valid JSON matching the VideoAnalysis interface. Return ONLY the JSON, no markdown.\n\nText:\n${result}`;

      const response = await fetch(
        `${GEMINI_API_URL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return this.parseAnalysis(text);
    }
  }

  async analyzeYouTubeVideo(url: string): Promise<VideoAnalysis> {
    const prompt = `Analyze this YouTube video: ${url}

Provide a comprehensive video analysis. Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "metadata": {
    "title": "Video title",
    "source": "${url}",
    "duration": "estimated duration",
    "resolution": "N/A",
    "fileSize": "N/A",
    "thumbnail": ""
  },
  "summary": {
    "short": "2-3 sentence summary of the video",
    "detailed": "Detailed paragraph analysis",
    "conclusion": "Final conclusion"
  },
  "timeline": [
    { "timestamp": "MM:SS", "title": "Section title", "description": "What happens in this section" }
  ],
  "transcript": [
    { "timestamp": "MM:SS", "text": "What is being said" }
  ],
  "scenes": [
    {
      "timestamp": "MM:SS",
      "thumbnail": "",
      "description": "Scene description",
      "objects": ["item1", "item2"],
      "people": ["1 person", "description"],
      "activities": ["activity1"]
    }
  ],
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "actionItems": ["action1", "action2", "action3"],
  "insights": ["insight1", "insight2", "insight3"]
}`;

    const result = await this.generateContent(prompt);
    return this.parseAnalysis(result);
  }

  /* ---------------------------------------------------------------- *
   * Deep football analysis
   * ---------------------------------------------------------------- */

  /**
   * Sampling fidelity has to scale with clip length: an 8 s clip costs ~550 video
   * tokens per second at 2 fps / high media resolution, so a full match at that
   * setting would not fit in the 1M context window.
   */
  private samplingFor(durationSeconds: number): { fps: number; mediaResolution: string } {
    if (durationSeconds > 0 && durationSeconds <= 300) {
      return { fps: 2, mediaResolution: "MEDIA_RESOLUTION_HIGH" };
    }
    if (durationSeconds === 0 || durationSeconds <= 1200) {
      return { fps: 1, mediaResolution: "MEDIA_RESOLUTION_HIGH" };
    }
    return { fps: 1, mediaResolution: "MEDIA_RESOLUTION_LOW" };
  }

  private async runPass(
    source: VideoSourcePart,
    prompt: string,
    signal?: AbortSignal
  ): Promise<PassResult> {
    let sampling = this.samplingFor(source.durationSeconds);

    const requestBody = () =>
      JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  fileUri: source.uri,
                  ...(source.mimeType ? { mimeType: source.mimeType } : {}),
                },
                videoMetadata: { fps: sampling.fps },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseMimeType: "application/json",
          mediaResolution: sampling.mediaResolution,
        },
      });

    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }

      const response = await fetch(
        `${GEMINI_API_URL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody(),
          signal,
        }
      );

      if (!response.ok) {
        lastError = await response.text();
        if (response.status === 429 || response.status >= 500) continue;

        // Too many video tokens for the context window — resample coarsely and retry once.
        if (
          response.status === 400 &&
          /token/i.test(lastError) &&
          sampling.mediaResolution !== "MEDIA_RESOLUTION_LOW"
        ) {
          sampling = { fps: 1, mediaResolution: "MEDIA_RESOLUTION_LOW" };
          continue;
        }

        throw new Error(`Gemini analysis failed (${response.status}): ${lastError}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text: string = (candidate?.content?.parts ?? [])
        .filter((part: { thought?: boolean; text?: string }) => !part.thought && part.text)
        .map((part: { text: string }) => part.text)
        .join("");

      if (!text) {
        const blockReason = data.promptFeedback?.blockReason || candidate?.finishReason;
        lastError = blockReason
          ? `Gemini returned no analysis (${blockReason}).`
          : "Gemini returned an empty response.";
        continue;
      }

      const { data: parsed, repaired } = parseLooseJson<Record<string, unknown>>(text);
      return { data: parsed, truncated: repaired || candidate?.finishReason === "MAX_TOKENS" };
    }

    throw new Error(lastError || "Gemini analysis failed after several attempts.");
  }

  /** Compact context handed to the final pass so the report agrees with passes 1 and 2. */
  private summarizeForReport(payload: Record<string, unknown>, keys: string[], limit: number): string {
    const subset: Record<string, unknown> = {};
    for (const key of keys) {
      if (payload[key] !== undefined) subset[key] = payload[key];
    }
    const json = JSON.stringify(subset);
    return json.length > limit ? `${json.slice(0, limit)}… (truncated)` : json;
  }

  private rosterLines(scan: Record<string, unknown>): string {
    const players = Array.isArray(scan.players) ? scan.players : [];
    if (players.length === 0) return "(no players were identified in pass 1)";

    return players
      .slice(0, 40)
      .map((player: Record<string, unknown>) => {
        const number = player.jerseyNumber || "unknown";
        const role = player.isGoalkeeper || player.role === "goalkeeper" ? "GK" : player.position || "outfield";
        return `- #${number} (${player.team || "unknown team"}, ${role})`;
      })
      .join("\n");
  }

  private async runDeepAnalysis(
    source: VideoSourcePart,
    metadata: VideoMetadata,
    options: SportsAnalysisOptions
  ): Promise<SportsAnalysis> {
    const { onProgress, signal } = options;
    const context = {
      sourceHint: source.sourceHint,
      durationLabel: metadata.duration,
    };
    const caveats: string[] = [];

    onProgress?.({
      stage: "analyzing-frames",
      progress: 34,
      message: "Detecting players, jersey numbers and tracking movement...",
    });

    const scanPass = await this.runPass(source, buildScanPrompt(context), signal);
    if (scanPass.truncated) {
      caveats.push("The player-tracking pass hit the output limit — some player detail may be missing.");
    }

    onProgress?.({
      stage: "analyzing-frames",
      progress: 58,
      message: "Logging touches, passes, kicks, shots, goals and referee calls...",
    });

    let eventPass: PassResult = { data: {}, truncated: false };
    try {
      eventPass = await this.runPass(
        source,
        buildEventPrompt(context, this.rosterLines(scanPass.data)),
        signal
      );
      if (eventPass.truncated) {
        caveats.push("The event pass hit the output limit — the longest event lists were cut short.");
      }
    } catch (error) {
      caveats.push(
        `Event-level analysis failed: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }

    onProgress?.({
      stage: "generating-summary",
      progress: 80,
      message: "Building tactics, ratings and the final match report...",
    });

    let reportPass: PassResult = { data: {}, truncated: false };
    try {
      reportPass = await this.runPass(
        source,
        buildReportPrompt(
          context,
          this.summarizeForReport(scanPass.data, ["playerCount", "players", "goalkeepers"], 14000),
          this.summarizeForReport(
            eventPass.data,
            ["goals", "shots", "refereeDecisions", "defensiveActions", "timeline"],
            14000
          )
        ),
        signal
      );
    } catch (error) {
      caveats.push(
        `Tactical report pass failed: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }

    onProgress?.({
      stage: "preparing-report",
      progress: 94,
      message: "Assembling the match report...",
    });

    return buildSportsAnalysis({
      scan: scanPass.data,
      events: eventPass.data,
      report: reportPass.data,
      metadata,
      durationSeconds: source.durationSeconds,
      caveats,
    });
  }

  async analyzeSportsVideo(
    file: File,
    options: SportsAnalysisOptions = {}
  ): Promise<SportsAnalysis> {
    const { onProgress, signal } = options;

    onProgress?.({ stage: "uploading", progress: 2, message: "Reading video file..." });
    const probe = await probeVideoFile(file);

    const metadata: VideoMetadata = {
      title: file.name,
      source: "Local File",
      duration: probe.durationSeconds > 0 ? secondsToTimestamp(probe.durationSeconds) : "unknown",
      resolution: probe.width > 0 ? `${probe.width}x${probe.height}` : "unknown",
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      thumbnail: probe.thumbnail,
    };

    const uploaded = await uploadVideoToGemini(file, this.apiKey, {
      signal,
      onProgress: (ratio) =>
        onProgress?.({
          stage: "uploading",
          progress: 2 + ratio * 23,
          message: `Uploading match footage... ${Math.round(ratio * 100)}%`,
        }),
      onStateChange: (state) =>
        onProgress?.({
          stage: "processing-video",
          progress: 28,
          message:
            state === "PROCESSING"
              ? "Gemini is decoding the footage..."
              : "Footage ready for analysis.",
        }),
    });

    return this.runDeepAnalysis(
      {
        uri: uploaded.uri,
        mimeType: uploaded.mimeType,
        durationSeconds: probe.durationSeconds,
        sourceHint: file.name,
      },
      metadata,
      options
    );
  }

  async analyzeSportsYouTubeVideo(
    url: string,
    options: SportsAnalysisOptions = {}
  ): Promise<SportsAnalysis> {
    options.onProgress?.({
      stage: "processing-video",
      progress: 20,
      message: "Fetching the YouTube video...",
    });

    const metadata: VideoMetadata = {
      title: "YouTube match footage",
      source: url,
      duration: "unknown",
      resolution: "N/A",
      fileSize: "N/A",
      thumbnail: youtubeThumbnail(url),
    };

    return this.runDeepAnalysis(
      { uri: url, durationSeconds: 0, sourceHint: url },
      metadata,
      options
    );
  }
}
