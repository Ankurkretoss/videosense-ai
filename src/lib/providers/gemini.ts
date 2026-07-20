import type { VideoAnalysis } from "@/types/analysis";
import type { AIProvider } from "@/lib/ai";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || "gemini-2.0-flash";
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
}
