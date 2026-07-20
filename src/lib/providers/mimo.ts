import type { VideoAnalysis } from "@/types/analysis";
import type { AIProvider } from "@/lib/ai";

const MIMO_API_URL = "https://api.xiaomimimo.com/v1/chat/completions";

export class MimoProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async generateContent(messages: object[]): Promise<string> {
    const response = await fetch(MIMO_API_URL, {
      method: "POST",
      headers: {
        "api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mimo-v2.5",
        messages,
        max_completion_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MiMo API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in MiMo response");
    }

    return content;
  }

  private parseAnalysis(jsonStr: string): VideoAnalysis {
    const cleaned = jsonStr.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned) as VideoAnalysis;
  }

  async analyzeVideo(file: File): Promise<VideoAnalysis> {
    const base64 = await this.fileToBase64(file);
    const mimeType = file.type || "video/mp4";

    const messages = [
      {
        role: "system",
        content: "You are an expert video analyst. Always respond with valid JSON only, no markdown formatting or code blocks.",
      },
      {
        role: "user",
        content: [
          {
            type: "video_url",
            video_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
            fps: 2,
            media_resolution: "default",
          },
          {
            type: "text",
            text: `Analyze this video titled "${file.name}". Provide a comprehensive analysis. Return ONLY valid JSON with this exact structure:
{
  "metadata": {
    "title": "${file.name}",
    "source": "Local File",
    "duration": "video duration",
    "resolution": "video resolution",
    "fileSize": "${(file.size / (1024 * 1024)).toFixed(2)} MB",
    "thumbnail": ""
  },
  "summary": {
    "short": "2-3 sentence summary",
    "detailed": "Detailed paragraph analysis",
    "conclusion": "Final conclusion"
  },
  "timeline": [
    { "timestamp": "MM:SS", "title": "Section title", "description": "What happens" }
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
      "people": ["1 person"],
      "activities": ["activity1"]
    }
  ],
  "topics": ["topic1", "topic2", "topic3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "actionItems": ["action1", "action2"],
  "insights": ["insight1", "insight2"]
}`,
          },
        ],
      },
    ];

    const result = await this.generateContent(messages);
    return this.parseAnalysis(result);
  }

  async analyzeYouTubeVideo(url: string): Promise<VideoAnalysis> {
    const videoId = this.extractVideoId(url);
    let title = "YouTube Video";

    try {
      const infoResponse = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (infoResponse.ok) {
        const info = await infoResponse.json();
        title = info.title || title;
      }
    } catch {
      // Ignore errors
    }

    const messages = [
      {
        role: "system",
        content: "You are an expert video analyst. Always respond with valid JSON only, no markdown formatting or code blocks.",
      },
      {
        role: "user",
        content: `Analyze this YouTube video: ${url}
Title: ${title}

Provide a comprehensive video analysis. Return ONLY valid JSON with this exact structure:
{
  "metadata": {
    "title": "${title}",
    "source": "${url}",
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
    { "timestamp": "MM:SS", "title": "Section title", "description": "What happens" }
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
      "people": ["1 person"],
      "activities": ["activity1"]
    }
  ],
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "actionItems": ["action1", "action2", "action3"],
  "insights": ["insight1", "insight2", "insight3"]
}`,
      },
    ];

    const result = await this.generateContent(messages);
    return this.parseAnalysis(result);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
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
