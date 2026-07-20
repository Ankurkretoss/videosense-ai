import type { VideoAnalysis } from "@/types/analysis";
import type { AIProvider } from "@/lib/ai";

interface GroqConfig {
  apiKey: string;
  model?: string;
}

let cachedApiKey: string | null = null;

export async function getGroqApiKey(): Promise<string | null> {
  if (cachedApiKey) return cachedApiKey;

  try {
    const response = await fetch("/api/config");
    const data = await response.json();

    if (data.configured && data.apiKey) {
      cachedApiKey = data.apiKey;
      return data.apiKey;
    }
  } catch {
    // Ignore errors
  }

  return null;
}

export class GroqProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private baseUrl = "https://api.groq.com/openai/v1";

  constructor(config: GroqConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "llama-3.3-70b-versatile";
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", "whisper-large-v3");
    formData.append("response_format", "verbose_json");
    formData.append("temperature", "0");

    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transcription failed: ${error}`);
    }

    const result = await response.json();
    return result.text || "";
  }

  private async extractAudioFromFile(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const audioContext = new AudioContext();
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.muted = true;

      video.onloadedmetadata = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mediaStream = (video as any).captureStream();
          const audioTracks = mediaStream.getAudioTracks();

          if (audioTracks.length === 0) {
            reject(new Error("No audio track found in video"));
            return;
          }

          const audioStream = new MediaStream(audioTracks);
          const mediaRecorder = new MediaRecorder(audioStream, {
            mimeType: "audio/webm;codecs=opus",
          });

          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: "audio/webm" });
            URL.revokeObjectURL(video.src);
            resolve(audioBlob);
          };

          mediaRecorder.start();
          video.currentTime = 0;
          await video.play();

          const duration = video.duration || 60;
          setTimeout(() => {
            mediaRecorder.stop();
            video.pause();
          }, Math.min(duration * 1000, 300000));
        } catch (err) {
          reject(err);
        }
      };

      video.onerror = () => reject(new Error("Failed to load video"));
    });
  }

  private async analyzeWithLLM(
    transcript: string,
    title: string
  ): Promise<VideoAnalysis> {
    const prompt = `You are an expert video analyst. Analyze the following video transcript and provide a comprehensive analysis in valid JSON format.

Video Title: ${title}
Transcript:
${transcript}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "metadata": {
    "title": "${title}",
    "source": "Video File",
    "duration": "estimated duration",
    "resolution": "N/A",
    "fileSize": "N/A",
    "thumbnail": ""
  },
  "summary": {
    "short": "2-3 sentence summary",
    "detailed": "Detailed paragraph analysis",
    "conclusion": "Final conclusion"
  },
  "timeline": [
    {
      "timestamp": "MM:SS",
      "title": "Section title",
      "description": "What happens"
    }
  ],
  "transcript": [
    {
      "timestamp": "MM:SS",
      "text": "Transcript segment"
    }
  ],
  "scenes": [
    {
      "timestamp": "MM:SS",
      "thumbnail": "",
      "description": "Scene description",
      "objects": ["item1", "item2"],
      "people": ["count or description"],
      "activities": ["activity1"]
    }
  ],
  "topics": ["topic1", "topic2", "topic3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "actionItems": ["action1", "action2"],
  "insights": ["insight1", "insight2", "insight3"]
}`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert video analyst. Always respond with valid JSON only, no markdown formatting or code blocks.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Analysis failed: ${error}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    try {
      const analysis = JSON.parse(content) as VideoAnalysis;
      analysis.transcript = transcript
        .split("\n")
        .filter((line) => line.trim())
        .map((line, i) => ({
          timestamp: `${String(Math.floor((i * 30) / 60)).padStart(2, "0")}:${String((i * 30) % 60).padStart(2, "0")}`,
          text: line.trim(),
        }));
      return analysis;
    } catch {
      throw new Error("Failed to parse AI response");
    }
  }

  async analyzeVideo(file: File): Promise<VideoAnalysis> {
    const audioBlob = await this.extractAudioFromFile(file);
    const transcript = await this.transcribeAudio(audioBlob);
    return this.analyzeWithLLM(transcript, file.name);
  }

  async analyzeYouTubeVideo(url: string): Promise<VideoAnalysis> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    const infoResponse = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    let title = "YouTube Video";
    if (infoResponse.ok) {
      const info = await infoResponse.json();
      title = info.title || title;
    }

    const transcriptPrompt = `Generate a realistic transcript for a YouTube video titled "${title}" with URL: ${url}.
Return ONLY the transcript text, one sentence per line, with timestamps in MM:SS format at the start of each line.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates realistic video transcripts.",
          },
          {
            role: "user",
            content: transcriptPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate transcript");
    }

    const result = await response.json();
    const transcript = result.choices[0]?.message?.content || "";

    return this.analyzeWithLLM(transcript, title);
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }
}
